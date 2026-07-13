import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import ProtectedLayoutClient from '@/components/ProtectedLayoutClient';
import { ROUTES } from '@/lib/routes';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect(ROUTES.LOGIN);
  }
  return (
    <ProtectedLayoutClient username={session.username} profile={session.profile}>
      {children}
    </ProtectedLayoutClient>
  );
}
