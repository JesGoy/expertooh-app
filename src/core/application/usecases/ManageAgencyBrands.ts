import { AgencyBrandRepository } from '../ports/AgencyBrandRepository';

const DEFAULT_OTHERS_LIMIT = 40;

export class GetAgencyBrandSets {
  constructor(private readonly repo: AgencyBrandRepository) {}
  async execute(agencyUserId: number, search?: string, limit = DEFAULT_OTHERS_LIMIT) {
    const mine = await this.repo.listAgencyBrands(agencyUserId);
    const others = await this.repo.listOtherBrands(agencyUserId, search, limit);
    return { mine, others };
  }
}

export class SearchBrands {
  constructor(private readonly repo: AgencyBrandRepository) {}
  async execute(search?: string, limit?: number) {
    return this.repo.searchBrands(search, limit);
  }
}

export class AssignAgencyBrand {
  constructor(private readonly repo: AgencyBrandRepository) {}
  async execute(agencyUserId: number, brandId: number) {
    await this.repo.assign(agencyUserId, brandId);
  }
}

export class UnassignAgencyBrand {
  constructor(private readonly repo: AgencyBrandRepository) {}
  async execute(agencyUserId: number, brandId: number) {
    await this.repo.unassign(agencyUserId, brandId);
  }
}