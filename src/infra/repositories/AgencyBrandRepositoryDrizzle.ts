import { and, eq, ilike, notInArray } from 'drizzle-orm';
import { getDb } from '@/infra/db/client';
import { agencyBrandTable, brandTable, categoryTable } from '@/infra/db/schema';
import { AgencyBrandRepository } from '@/core/application/ports/AgencyBrandRepository';

export class AgencyBrandRepositoryDrizzle implements AgencyBrandRepository {
  async listAgencyBrands(agencyUserId: number) {
    const db = getDb();
    return db
      .select({
        id: brandTable.id,
        name: brandTable.name,
        categoryName: categoryTable.name,
      })
      .from(agencyBrandTable)
      .innerJoin(brandTable, eq(agencyBrandTable.brandId, brandTable.id))
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .where(eq(agencyBrandTable.agencyUserId, agencyUserId))
      .orderBy(brandTable.name);
  }

  async listOtherBrands(agencyUserId: number, search?: string, limit = 40) {
    const db = getDb();
    const mine = await db
      .select({ brandId: agencyBrandTable.brandId })
      .from(agencyBrandTable)
      .where(eq(agencyBrandTable.agencyUserId, agencyUserId));
    const mineIds = mine.map(r => r.brandId);
    const whereParts: any[] = [];
    if (mineIds.length) whereParts.push(notInArray(brandTable.id, mineIds));
    if (search) whereParts.push(ilike(brandTable.name, `%${search}%`));
    const whereExpr = whereParts.length > 1 ? and(...whereParts) : whereParts[0];

    return db
      .select({
        id: brandTable.id,
        name: brandTable.name,
        categoryName: categoryTable.name,
      })
      .from(brandTable)
      .leftJoin(categoryTable, eq(brandTable.categoryId, categoryTable.id))
      .where(whereExpr)
      .orderBy(brandTable.name)
      .limit(limit);
  }

  async assign(agencyUserId: number, brandId: number) {
    const db = getDb();
    await db.insert(agencyBrandTable)
      .values({ agencyUserId, brandId })
      .onConflictDoNothing();
  }

  async unassign(agencyUserId: number, brandId: number) {
    const db = getDb();
    await db.delete(agencyBrandTable)
      .where(and(
        eq(agencyBrandTable.agencyUserId, agencyUserId),
        eq(agencyBrandTable.brandId, brandId),
      ));
  }
}