import { UserRepositoryDrizzle } from '@/infra/repositories/UserRepositoryDrizzle';
import { BcryptHashService } from '@/infra/security/BcryptHashService';
import { LoginUser } from '@/core/application/usecases/LoginUser';
import { ChangePassword } from '@/core/application/usecases/ChangePassword';
import { AgencyBrandRepositoryDrizzle } from '@/infra/repositories/AgencyBrandRepositoryDrizzle';
import { GetAgencyBrandSets, SearchBrands, AssignAgencyBrand, UnassignAgencyBrand } from '@/core/application/usecases/ManageAgencyBrands';

export function makeLoginUser() {
  const users = new UserRepositoryDrizzle();
  const hash = new BcryptHashService();
  return new LoginUser({ users, hash });
}

export function makeChangePassword() {
  const users = new UserRepositoryDrizzle();
  const hash = new BcryptHashService();
  return new ChangePassword({ users, hash });
}

export function makeAgencyBrandUseCases() {
  const repo = new AgencyBrandRepositoryDrizzle();
  return {
    getSets: new GetAgencyBrandSets(repo),
    searchBrands: new SearchBrands(repo),
    assign: new AssignAgencyBrand(repo),
    unassign: new UnassignAgencyBrand(repo),
  };
}