import { and, count, countDistinct, eq, inArray, isNotNull, lte, sql, SQL } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { getDb } from '@/infra/db/client';
import {
  brandTable,
  categoryTable,
  communeTable,
  elementRecordTable,
  elementTable,
  providerTable,
  provinceTable,
  regionTable,
  typeTable,
} from '@/infra/db/schema';
import type { ComparisonBreakdown, ComparisonEntityKind } from '@/core/domain/constants/comparison';
import type {
  ComparisonFilters,
  ComparisonReviewRepository,
  EntityBreakdownRow,
  EntityMonthRow,
  EntityPhotoRow,
  EntityTotalsRow,
  YearMonth,
} from '@/core/application/ports/ComparisonReviewRepository';

function periodKey(ym: YearMonth): number {
  return ym.year * 100 + ym.month;
}

type EntitySqlSpec = {
  /** Columna de agrupación y de identidad de la entidad */
  id: AnyPgColumn;
  /** Nombre display de la entidad */
  name: AnyPgColumn;
  /** Columna del inArray(entityIds): FK indexada, puede diferir de id */
  filter: AnyPgColumn;
};

/**
 * Mapa dimensión → columnas SQL. Sirve tanto para la dimensión comparada como
 * para los breakdowns secundarios. Región se filtra vía Province.regionId
 * (Commune → Province → Region: la comuna no referencia la región directo).
 */
const ENTITY_SQL: Record<ComparisonEntityKind, EntitySqlSpec> = {
  brand: { id: brandTable.id, name: brandTable.name, filter: elementRecordTable.brandId },
  type: { id: typeTable.id, name: typeTable.name, filter: elementTable.typeId },
  region: { id: regionTable.id, name: regionTable.name, filter: provinceTable.regionId },
  commune: { id: communeTable.id, name: communeTable.name, filter: elementTable.communeId },
  category: { id: categoryTable.id, name: categoryTable.name, filter: brandTable.categoryId },
};

/** Expresiones de métricas compartidas por todas las agregaciones */
const metricSelects = {
  faces: count().mapWith(Number),
  elements: countDistinct(elementRecordTable.elementId).mapWith(Number),
  investmentCLP: sql<number>`COALESCE(SUM(${elementRecordTable.valueCLP}), 0)::float8`.mapWith(Number),
  areaM2: sql<number>`COALESCE(SUM(${elementRecordTable.areaM2}), 0)::float8`.mapWith(Number),
  audience: sql<number>`COALESCE(SUM(${elementRecordTable.persons}), 0)::float8`.mapWith(Number),
};

/** Promedio ponderado por persons (las columnas de audiencia vienen juntas en el import) */
function weightedPct(column: AnyPgColumn) {
  return sql<number | null>`SUM(${elementRecordTable.persons} * ${column}) / NULLIF(SUM(${elementRecordTable.persons}), 0)`;
}

export class ComparisonReviewRepositoryDrizzle implements ComparisonReviewRepository {
  /**
   * Condiciones de filtro compartidas. El inArray sobre la columna de la
   * dimensión excluye registros no atribuibles (columna NULL): un soporte sin
   * comuna no cuenta para ningún territorio, uno sin marca para ninguna categoría.
   */
  private buildConditions(f: ComparisonFilters): SQL[] {
    const parts: SQL[] = [
      inArray(ENTITY_SQL[f.kind].filter, f.entityIds),
      sql`(${elementRecordTable.year} * 100 + ${elementRecordTable.month}) BETWEEN ${periodKey(f.from)} AND ${periodKey(f.to)}`,
    ];
    if (f.typeId) parts.push(eq(elementTable.typeId, f.typeId));
    if (f.providerId) parts.push(eq(elementTable.providerId, f.providerId));
    if (f.communeId) parts.push(eq(elementTable.communeId, f.communeId));
    if (f.regionId) parts.push(eq(provinceTable.regionId, f.regionId));
    if (f.categoryId) parts.push(eq(brandTable.categoryId, f.categoryId));
    return parts;
  }

  /**
   * Join chain único para todas las agregaciones (FKs indexadas; Postgres
   * elimina los left joins no referenciados). Brand va en left join: comparando
   * formatos/territorios cuentan también los registros sin marca.
   * Nota: no se tipa como helper genérico porque el builder encadenado de
   * Drizzle no infiere bien un `SelectedFields` parametrizado; se repite
   * el chain literal en cada método sobre el mismo `getDb().select(...)`.
   */

  async aggregateTotals(f: ComparisonFilters): Promise<EntityTotalsRow[]> {
    const entity = ENTITY_SQL[f.kind];
    const withCategory = f.kind === 'brand';
    const rows = await getDb()
      .select({
        entityId: sql<number>`${entity.id}`.mapWith(Number),
        // el inArray sobre la columna de la dimensión garantiza nombre no nulo
        entityName: sql<string>`${entity.name}`,
        categoryName: withCategory
          ? sql<string | null>`${categoryTable.name}`
          : sql<string | null>`NULL`,
        ...metricSelects,
        malePct: weightedPct(elementRecordTable.malePct),
        femalePct: weightedPct(elementRecordTable.femalePct),
        nseHighPct: weightedPct(elementRecordTable.nseHighPct),
        nseMidPct: weightedPct(elementRecordTable.nseMidPct),
        nseLowPct: weightedPct(elementRecordTable.nseLowPct),
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .leftJoin(typeTable, eq(elementTable.typeId, typeTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .leftJoin(regionTable, eq(provinceTable.regionId, regionTable.id))
      .where(and(...this.buildConditions(f)))
      .groupBy(entity.id, entity.name, ...(withCategory ? [categoryTable.name] : []));

    return rows.map(({ malePct, femalePct, nseHighPct, nseMidPct, nseLowPct, ...rest }) => ({
      ...rest,
      audienceProfile:
        rest.audience > 0 && malePct !== null
          ? {
              malePct: malePct ?? 0,
              femalePct: femalePct ?? 0,
              nseHighPct: nseHighPct ?? 0,
              nseMidPct: nseMidPct ?? 0,
              nseLowPct: nseLowPct ?? 0,
            }
          : null,
    }));
  }

  async aggregateByMonth(f: ComparisonFilters): Promise<EntityMonthRow[]> {
    const entity = ENTITY_SQL[f.kind];
    return getDb()
      .select({
        entityId: sql<number>`${entity.id}`.mapWith(Number),
        year: sql<number>`${elementRecordTable.year}`.mapWith(Number),
        month: sql<number>`${elementRecordTable.month}`.mapWith(Number),
        ...metricSelects,
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .leftJoin(typeTable, eq(elementTable.typeId, typeTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .leftJoin(regionTable, eq(provinceTable.regionId, regionTable.id))
      .where(and(...this.buildConditions(f)))
      .groupBy(entity.id, elementRecordTable.year, elementRecordTable.month)
      .orderBy(elementRecordTable.year, elementRecordTable.month);
  }

  async aggregateByBreakdown(
    f: ComparisonFilters,
    breakdown: ComparisonBreakdown,
  ): Promise<EntityBreakdownRow[]> {
    const entity = ENTITY_SQL[f.kind];
    const bd = ENTITY_SQL[breakdown];
    return getDb()
      .select({
        entityId: sql<number>`${entity.id}`.mapWith(Number),
        breakdownId: sql<number>`${bd.id}`.mapWith(Number),
        // el WHERE isNotNull(bd.id) garantiza nombre no nulo
        breakdownName: sql<string>`${bd.name}`,
        ...metricSelects,
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .leftJoin(typeTable, eq(elementTable.typeId, typeTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .leftJoin(regionTable, eq(provinceTable.regionId, regionTable.id))
      // Excluye registros no atribuibles al breakdown (sin comuna, sin tipo, sin marca)
      .where(and(...this.buildConditions(f), isNotNull(bd.id)))
      .groupBy(entity.id, bd.id, bd.name);
  }

  async samplePhotos(f: ComparisonFilters, perEntity: number): Promise<EntityPhotoRow[]> {
    const db = getDb();
    const entity = ENTITY_SQL[f.kind];
    const ranked = db
      .select({
        entityId: sql<number>`${entity.id}`.mapWith(Number).as('entity_id'),
        recordId: sql<number>`${elementRecordTable.id}`.mapWith(Number).as('record_id'),
        photoUrl: sql<string>`${elementRecordTable.photoUrl}`.as('photo_url'),
        capturedAt: elementRecordTable.capturedAt,
        address: elementTable.address,
        // alias explícitos: Commune.name y Provider.name colisionan dentro del subquery
        communeName: sql<string | null>`${communeTable.name}`.as('commune_name'),
        providerName: sql<string | null>`${providerTable.name}`.as('provider_name'),
        rowNumber: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${entity.id} ORDER BY ${elementRecordTable.capturedAt} DESC NULLS LAST)`
          .mapWith(Number)
          .as('row_number'),
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(providerTable, eq(elementTable.providerId, providerTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .leftJoin(typeTable, eq(elementTable.typeId, typeTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .leftJoin(regionTable, eq(provinceTable.regionId, regionTable.id))
      // Solo URLs completas (las filas antiguas traen nombres de archivo sin host)
      .where(and(...this.buildConditions(f), sql`${elementRecordTable.photoUrl} ILIKE 'http%'`))
      .as('ranked_photos');

    return db
      .select({
        entityId: ranked.entityId,
        recordId: ranked.recordId,
        photoUrl: ranked.photoUrl,
        capturedAt: ranked.capturedAt,
        address: ranked.address,
        communeName: ranked.communeName,
        providerName: ranked.providerName,
      })
      .from(ranked)
      .where(lte(ranked.rowNumber, perEntity));
  }
}
