import { AgencyBrandRepository } from '../ports/AgencyBrandRepository';

export class GetAgencyBrandSets {
  constructor(private readonly repo: AgencyBrandRepository) {}
  async execute(agencyUserId: number, search?: string) {
    const mine = await this.repo.listAgencyBrands(agencyUserId);
    const others = await this.repo.listOtherBrands(agencyUserId, search, 40);
    return { mine, others };
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