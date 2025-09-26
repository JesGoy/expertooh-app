import { getSession } from '@/infra/security/session';
import { redirect } from 'next/navigation';
import { makeAgencyBrandUseCases } from '@/infra/container/auth';
import BrandReviewClient from './BrandReviewClient';

export const dynamic = 'force-dynamic';

function formatISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function BrandReviewPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = (await searchParams) || {};
  const session = await getSession();
  if (!session) redirect('/login');
  if (session.profile !== 'agencia') redirect('/dashboard');

  const { getSets } = makeAgencyBrandUseCases();
  const { mine, others } = await getSets.execute(session.userId);

  // Defaults últimos 30 días
  const today = new Date();
  const fromDefault = new Date();
  fromDefault.setDate(today.getDate() - 30);

  const initialFrom = typeof sp.from === 'string' ? sp.from : formatISODate(fromDefault);
  const initialTo = typeof sp.to === 'string' ? sp.to : formatISODate(today);

  // Normaliza null -> undefined (si aplica)
  const norm = <T extends { categoryName: string | null }>(list: T[]) =>
    list.map(b => ({ ...b, categoryName: b.categoryName ?? undefined }));

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink">Brand Review</h1>
        <p className="text-sm text-neutral-600 mt-1">
          Selecciona marcas y un rango de fechas para la comparación.
        </p>
      </header>
      <BrandReviewClient
        mine={norm(mine)}
        others={norm(others)}
        initialFrom={initialFrom}
        initialTo={initialTo}
      />
    </main>
  );
}