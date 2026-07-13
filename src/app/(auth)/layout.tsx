import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) {
    redirect(ROUTES.DASHBOARD);
  }
  return <>{children}</>;
}
