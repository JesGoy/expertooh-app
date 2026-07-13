export type BrandListItem = { id: number; name: string; categoryName: string | null };

export interface AgencyBrandRepository {
  listAgencyBrands(agencyUserId: number): Promise<BrandListItem[]>;
  listOtherBrands(agencyUserId: number, search?: string, limit?: number): Promise<BrandListItem[]>;
  /** Búsqueda libre sobre todas las marcas (picker de perfil admin) */
  searchBrands(search?: string, limit?: number): Promise<BrandListItem[]>;
  assign(agencyUserId: number, brandId: number): Promise<void>;
  unassign(agencyUserId: number, brandId: number): Promise<void>;
}