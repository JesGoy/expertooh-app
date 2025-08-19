import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (session) {
    redirect('/dashboard');
  }
  return <>{children}</>;
}
