'use server';

import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import { makeChangePassword } from '@/infra/container/auth';
import { changePasswordSchema } from '@/infra/validation/password';
import { PasswordChangeError } from '@/core/domain/errors/PasswordErrors';

export type ChangePasswordState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function changePasswordAction(
  _prevState: ChangePasswordState,
  formData: FormData
): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) redirect('/login');

  const data = {
    currentPassword: formData.get('currentPassword') as string,
    newPassword: formData.get('newPassword') as string,
    confirmPassword: formData.get('confirmPassword') as string,
  };

  // Validación
  const parsed = changePasswordSchema.safeParse(data);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Ejecutar use case
  try {
    const uc = makeChangePassword();
    await uc.execute({
      userId: session.userId,
      currentPassword: parsed.data.currentPassword,
      newPassword: parsed.data.newPassword,
    });

    return { success: true };
  } catch (err) {
    if (err instanceof PasswordChangeError) {
      return { error: err.message };
    }
    return { error: 'Error al cambiar contraseña' };
  }
}
