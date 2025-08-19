'use server';

import { redirect } from 'next/navigation';
import { makeLoginUser } from '@/infra/container/auth';
import { loginSchema } from '@/infra/validation/auth';
import { createSession, destroySession } from '@/infra/security/session';

export async function loginAction(prevState: { error?: string } | undefined, formData: FormData) {
  const username = String(formData.get('username') || '');
  const password = String(formData.get('password') || '');
  const rememberRaw = String(formData.get('remember') || '');

  const parsed = loginSchema.safeParse({ username, password, remember: rememberRaw });
  if (!parsed.success) {
    return { error: parsed.error.issues?.[0]?.message || 'Datos inválidos' };
  }

  try {
    const uc = makeLoginUser();
    const { user } = await uc.execute({ username: parsed.data.username, password: parsed.data.password });
    await createSession({ userId: user.id, username: user.username, role: user.role }, { remember: parsed.data.remember === 'on' });
  } catch (err: any) {
    return { error: err?.message || 'Error al iniciar sesión' };
  }

  // If everything succeeded, perform the redirect outside the try/catch so it isn't swallowed
  redirect('/');
}

export async function logoutAction() {
  await destroySession();
  redirect('/login');
}
