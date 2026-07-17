/**
 * Catálogos de dimensiones para filtros de reportes (selects de la UI).
 * Dimensiones casi estáticas: se cachean en el container.
 */

export type CatalogItem = { id: number; name: string; detail?: string };

export type ReportCatalogs = {
  regions: CatalogItem[];
  types: CatalogItem[];
  providers: CatalogItem[];
  categories: CatalogItem[];
};

export interface ReportCatalogsRepository {
  getCatalogs(): Promise<ReportCatalogs>;
  /** Comunas con su región como `detail` (desambigua nombres homónimos) */
  getCommunes(): Promise<CatalogItem[]>;
}
