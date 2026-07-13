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
import type {
  BrandGeoRow,
  BrandMonthRow,
  BrandPhotoRow,
  BrandReviewFilters,
  BrandReviewRepository,
  BrandTotalsRow,
  BrandTypeRow,
  GeoLevel,
  YearMonth,
} from '@/core/application/ports/BrandReviewRepository';

function periodKey(ym: YearMonth): number {
  return ym.year * 100 + ym.month;
}

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

export class BrandReviewRepositoryDrizzle implements BrandReviewRepository {
  /**
   * Condiciones de filtro compartidas. Requiere que la query tenga joins a:
   * Element (siempre), Commune+Province (por regionId), Brand (por categoryId).
   */
  private buildConditions(f: BrandReviewFilters): SQL[] {
    const parts: SQL[] = [
      inArray(elementRecordTable.brandId, f.brandIds),
      sql`(${elementRecordTable.year} * 100 + ${elementRecordTable.month}) BETWEEN ${periodKey(f.from)} AND ${periodKey(f.to)}`,
    ];
    if (f.typeId) parts.push(eq(elementTable.typeId, f.typeId));
    if (f.providerId) parts.push(eq(elementTable.providerId, f.providerId));
    if (f.communeId) parts.push(eq(elementTable.communeId, f.communeId));
    if (f.regionId) parts.push(eq(provinceTable.regionId, f.regionId));
    if (f.categoryId) parts.push(eq(brandTable.categoryId, f.categoryId));
    return parts;
  }

  async aggregateByBrand(f: BrandReviewFilters): Promise<BrandTotalsRow[]> {
    const db = getDb();
    const rows = await db
      .select({
        brandId: sql<number>`${elementRecordTable.brandId}`.mapWith(Number),
        brandName: brandTable.name,
        categoryName: categoryTable.name,
        ...metricSelects,
        malePct: weightedPct(elementRecordTable.malePct),
        femalePct: weightedPct(elementRecordTable.femalePct),
        nseHighPct: weightedPct(elementRecordTable.nseHighPct),
        nseMidPct: weightedPct(elementRecordTable.nseMidPct),
        nseLowPct: weightedPct(elementRecordTable.nseLowPct),
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .innerJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .where(and(...this.buildConditions(f)))
      .groupBy(elementRecordTable.brandId, brandTable.name, categoryTable.name);

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

  async aggregateByBrandMonth(f: BrandReviewFilters): Promise<BrandMonthRow[]> {
    const db = getDb();
    return db
      .select({
        brandId: sql<number>`${elementRecordTable.brandId}`.mapWith(Number),
        year: sql<number>`${elementRecordTable.year}`.mapWith(Number),
        month: sql<number>`${elementRecordTable.month}`.mapWith(Number),
        ...metricSelects,
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .where(and(...this.buildConditions(f)))
      .groupBy(elementRecordTable.brandId, elementRecordTable.year, elementRecordTable.month)
      .orderBy(elementRecordTable.year, elementRecordTable.month);
  }

  async aggregateByBrandGeo(f: BrandReviewFilters, level: GeoLevel): Promise<BrandGeoRow[]> {
    const db = getDb();
    const geo =
      level === 'region'
        ? { id: regionTable.id, name: regionTable.name }
        : { id: communeTable.id, name: communeTable.name };

    return db
      .select({
        brandId: sql<number>`${elementRecordTable.brandId}`.mapWith(Number),
        geoId: sql<number>`${geo.id}`.mapWith(Number),
        // el WHERE isNotNull(geo.id) garantiza nombre no nulo
        geoName: sql<string>`${geo.name}`,
        ...metricSelects,
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .leftJoin(regionTable, eq(provinceTable.regionId, regionTable.id))
      // Excluye soportes sin comuna vinculada (no se pueden ubicar geográficamente)
      .where(and(...this.buildConditions(f), isNotNull(geo.id)))
      .groupBy(elementRecordTable.brandId, geo.id, geo.name);
  }

  async aggregateByBrandType(f: BrandReviewFilters): Promise<BrandTypeRow[]> {
    const db = getDb();
    return db
      .select({
        brandId: sql<number>`${elementRecordTable.brandId}`.mapWith(Number),
        typeId: sql<number>`${typeTable.id}`.mapWith(Number),
        // el WHERE isNotNull(typeTable.id) garantiza nombre no nulo
        typeName: sql<string>`${typeTable.name}`,
        ...metricSelects,
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(typeTable, eq(elementTable.typeId, typeTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      // Excluye registros sin tipo/formato definido
      .where(and(...this.buildConditions(f), isNotNull(typeTable.id)))
      .groupBy(elementRecordTable.brandId, typeTable.id, typeTable.name);
  }

  async samplePhotos(f: BrandReviewFilters, perBrand: number): Promise<BrandPhotoRow[]> {
    const db = getDb();
    const ranked = db
      .select({
        brandId: sql<number>`${elementRecordTable.brandId}`.mapWith(Number).as('brand_id'),
        recordId: sql<number>`${elementRecordTable.id}`.mapWith(Number).as('record_id'),
        photoUrl: sql<string>`${elementRecordTable.photoUrl}`.as('photo_url'),
        capturedAt: elementRecordTable.capturedAt,
        address: elementTable.address,
        // alias explícitos: Commune.name y Provider.name colisionan dentro del subquery
        communeName: sql<string | null>`${communeTable.name}`.as('commune_name'),
        providerName: sql<string | null>`${providerTable.name}`.as('provider_name'),
        rowNumber: sql<number>`ROW_NUMBER() OVER (PARTITION BY ${elementRecordTable.brandId} ORDER BY ${elementRecordTable.capturedAt} DESC NULLS LAST)`
          .mapWith(Number)
          .as('row_number'),
      })
      .from(elementRecordTable)
      .innerJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(providerTable, eq(elementTable.providerId, providerTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      // Solo URLs completas (las filas antiguas traen nombres de archivo sin host)
      .where(and(...this.buildConditions(f), sql`${elementRecordTable.photoUrl} ILIKE 'http%'`))
      .as('ranked_photos');

    return db.select({
      brandId: ranked.brandId,
      recordId: ranked.recordId,
      photoUrl: ranked.photoUrl,
      capturedAt: ranked.capturedAt,
      address: ranked.address,
      communeName: ranked.communeName,
      providerName: ranked.providerName,
    })
      .from(ranked)
      .where(lte(ranked.rowNumber, perBrand));
  }
}
