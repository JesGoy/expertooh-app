import { UserRepositoryDrizzle } from '@/infra/repositories/UserRepositoryDrizzle';
import { BcryptHashService } from '@/infra/security/BcryptHashService';
import { LoginUser } from '@/core/application/usecases/LoginUser';
import { ElementRecordRepositoryDrizzle } from '@/infra/repositories/ElementRecordRepositoryDrizzle';
import { ListElementRecords } from '@/core/application/usecases/ListElementRecords';

export function makeLoginUser() {
  const users = new UserRepositoryDrizzle();
  const hash = new BcryptHashService();
  return new LoginUser({ users, hash });
}

export function makeListElementRecords() {
  const repo = new ElementRecordRepositoryDrizzle();
  return new ListElementRecords({ repo });
}

//Esto en otro lado