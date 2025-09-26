import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import ProtectedNavbar from '@/components/ProtectedNavbar';

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect('/login');
  }
  return (
    <>
      <ProtectedNavbar username={session.username} profile={session.profile} />
      {children}
    </>
  );
}
