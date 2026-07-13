import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

export default function Root() {
  redirect(ROUTES.DASHBOARD);
}
