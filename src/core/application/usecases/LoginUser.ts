import { normalizeUsername, type User } from '@/core/domain/entities/User';
import { InactiveUserError, InvalidCredentialsError } from '@/core/domain/errors/AuthErrors';
import type { HashService } from '@/core/application/ports/HashService';
import type { UserRepository } from '@/core/application/ports/UserRepository';

export type LoginUserInput = {
  username: string;
  password: string;
};

export type LoginUserOutput = {
  user: User;
};

export class LoginUser {
  constructor(
    private readonly deps: {
      users: UserRepository;
      hash: HashService;
    },
  ) {}

  async execute(input: LoginUserInput): Promise<LoginUserOutput> {
    const username = normalizeUsername(input.username);
    if (!username || !input.password) {
      throw new InvalidCredentialsError();
    }

    const user = await this.deps.users.findByUsername(username);
    if (!user) throw new InvalidCredentialsError();
    if (!user.isActive) throw new InactiveUserError();

    // En esta capa comparamos password con el hash
    if (!user.passwordHash) throw new InvalidCredentialsError();

    const ok = await this.deps.hash.compare(input.password, user.passwordHash);
    if (!ok) throw new InvalidCredentialsError();

    return { user };
  }
}
