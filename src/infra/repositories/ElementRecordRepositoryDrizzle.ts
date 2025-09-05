import type { ElementRecordRepository, ElementRecordFilters, ElementRecordListItem, ElementRecordListResult } from '@/core/application/ports/ElementRecordRepository';
import { and, count, desc, eq, ilike } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { getDb } from '@/infra/db/client';
import { elementRecordTable, elementTable, providerTable, typeTable, brandTable, categoryTable, communeTable, provinceTable, regionTable } from '@/infra/db/schema';

export class ElementRecordRepositoryDrizzle implements ElementRecordRepository {
  async list(filters: ElementRecordFilters): Promise<ElementRecordListResult> {
    const db = getDb();
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

  const whereParts: SQL[] = [];
    if (filters.providerId) whereParts.push(eq(elementTable.providerId, filters.providerId));
    if (filters.typeId) whereParts.push(eq(elementTable.typeId, filters.typeId));
    if (filters.brandName) whereParts.push(ilike(brandTable.name, `%${filters.brandName}%`));
    if (filters.year) whereParts.push(eq(elementRecordTable.year, filters.year));
    if (filters.month) whereParts.push(eq(elementRecordTable.month, filters.month));
    if (filters.communeId) whereParts.push(eq(elementTable.communeId, filters.communeId));

  const where = whereParts.length ? and(...whereParts) : undefined;

    // total
    const totalRows = await db
      .select({ value: count() })
      .from(elementRecordTable)
      .leftJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
  .where(where);
    const total = Number(totalRows[0]?.value ?? 0);

    // items
    const rows = await db
      .select({
        id: elementRecordTable.id,
        capturedAt: elementRecordTable.capturedAt,
        year: elementRecordTable.year,
        month: elementRecordTable.month,
        valueCLP: elementRecordTable.valueCLP,
        areaM2: elementRecordTable.areaM2,
        status: elementRecordTable.status,
        userAgent: elementRecordTable.userAgent,
        photoUrl: elementRecordTable.photoUrl,
        notes: elementRecordTable.notes,
        elementId: elementTable.id,
        address: elementTable.address,
        providerId: providerTable.id,
        providerName: providerTable.name,
        typeId: typeTable.id,
        typeName: typeTable.name,
        brandId: brandTable.id,
        brandName: brandTable.name,
        categoryId: categoryTable.id,
        categoryName: categoryTable.name,
        communeId: communeTable.id,
        communeName: communeTable.name,
        provinceName: provinceTable.name,
        regionName: regionTable.name,
      })
      .from(elementRecordTable)
      .leftJoin(elementTable, eq(elementRecordTable.elementId, elementTable.id))
      .leftJoin(providerTable, eq(elementTable.providerId, providerTable.id))
      .leftJoin(typeTable, eq(elementTable.typeId, typeTable.id))
      .leftJoin(brandTable, eq(elementRecordTable.brandId, brandTable.id))
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .leftJoin(communeTable, eq(elementTable.communeId, communeTable.id))
      .leftJoin(provinceTable, eq(communeTable.provinceId, provinceTable.id))
      .leftJoin(regionTable, eq(provinceTable.regionId, regionTable.id))
  .where(where)
      .orderBy(desc(elementRecordTable.capturedAt), desc(elementRecordTable.id))
      .limit(pageSize)
      .offset(offset);

    // Coerce to ElementRecordListItem ensuring elementId is number
    const items: ElementRecordListItem[] = rows.map((r) => ({
      ...r,
      elementId: (r.elementId ?? 0) as number,
    }));
    return { items, total, page, pageSize };
  }
}
