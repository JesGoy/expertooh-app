import { PasswordChangeError } from '@/core/domain/errors/PasswordErrors';
import type { UserRepository } from '../ports/UserRepository';
import type { HashService } from '../ports/HashService';

interface ChangePasswordInput {
  userId: number;
  currentPassword: string;
  newPassword: string;
}

export class ChangePassword {
  constructor(
    private readonly deps: {
      users: UserRepository;
      hash: HashService;
    },
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const { userId, currentPassword, newPassword } = input;

    // 1. Buscar usuario
    const user = await this.deps.users.findById(userId);
    if (!user) {
      throw new PasswordChangeError('Usuario no encontrado', 'USER_NOT_FOUND');
    }

    // 2. Verificar password actual
    const isValid = await this.deps.hash.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      throw new PasswordChangeError('Contraseña actual incorrecta', 'INVALID_CURRENT');
    }

    // 3. Validar fortaleza de nueva contraseña (mínimo 8 caracteres)
    if (newPassword.length < 8) {
      throw new PasswordChangeError(
        'La nueva contraseña debe tener al menos 8 caracteres',
        'WEAK_PASSWORD',
      );
    }

    // 4. Hash nueva contraseña
    const newHash = await this.deps.hash.hash(newPassword);

    // 5. Actualizar en DB
    await this.deps.users.updatePassword(userId, newHash);
  }
}
