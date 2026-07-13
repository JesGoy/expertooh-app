import { getDb } from '@/infra/db/client';
import { categoryTable, providerTable, regionTable, typeTable } from '@/infra/db/schema';
import type {
  ReportCatalogs,
  ReportCatalogsRepository,
} from '@/core/application/ports/ReportCatalogsRepository';

export class ReportCatalogsRepositoryDrizzle implements ReportCatalogsRepository {
  async getCatalogs(): Promise<ReportCatalogs> {
    const db = getDb();
    const [regions, types, providers, categories] = await Promise.all([
      db.select({ id: regionTable.id, name: regionTable.name }).from(regionTable).orderBy(regionTable.name),
      db.select({ id: typeTable.id, name: typeTable.name }).from(typeTable).orderBy(typeTable.name),
      db.select({ id: providerTable.id, name: providerTable.name }).from(providerTable).orderBy(providerTable.name),
      db.select({ id: categoryTable.id, name: categoryTable.name }).from(categoryTable).orderBy(categoryTable.name),
    ]);
    return { regions, types, providers, categories };
  }
}
