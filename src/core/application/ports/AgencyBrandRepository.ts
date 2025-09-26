export interface AgencyBrandRepository {
  listAgencyBrands(agencyUserId: number): Promise<{ id: number; name: string; categoryName: string | null }[]>;
  listOtherBrands(
    agencyUserId: number,
    search?: string,
    limit?: number
  ): Promise<{ id: number; name: string; categoryName: string | null }[]>;
  assign(agencyUserId: number, brandId: number): Promise<void>;
  unassign(agencyUserId: number, brandId: number): Promise<void>;
}