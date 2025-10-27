import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import ChangePasswordForm from './ChangePasswordForm';

export const dynamic = 'force-dynamic';

export default async function ChangePasswordPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  return (
    <main className="p-6 max-w-xl mx-auto space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Cambiar Contraseña</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Actualiza tu contraseña de acceso. Debe tener al menos 8 caracteres.
        </p>
      </header>
      <ChangePasswordForm />
    </main>
  );
}
