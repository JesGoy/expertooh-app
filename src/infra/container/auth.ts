import { UserRepositoryDrizzle } from '@/infra/repositories/UserRepositoryDrizzle';
import { BcryptHashService } from '@/infra/security/BcryptHashService';
import { LoginUser } from '@/core/application/usecases/LoginUser';

export function makeLoginUser() {
  const users = new UserRepositoryDrizzle();
  const hash = new BcryptHashService();
  return new LoginUser({ users, hash });
}
