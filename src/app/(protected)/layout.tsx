import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import ProtectedLayoutClient from '@/components/ProtectedLayoutClient';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return (
    <ProtectedLayoutClient username={session.username} profile={session.profile}>
      {children}
    </ProtectedLayoutClient>
  );
}
