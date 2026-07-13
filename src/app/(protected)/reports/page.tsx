import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/infra/security/session';
import { ROUTES } from '@/lib/routes';
import { reportsForProfile, type ReportDefinition } from './registry';

export const dynamic = 'force-dynamic';

function ReportCard({ report }: { report: ReportDefinition }) {
  const isAvailable = report.status === 'available';
  const card = (
    <div
      className={`h-full rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-6 transition-shadow ${
        isAvailable ? 'hover:shadow-md hover:border-brand/40' : 'opacity-60'
      }`}
    >
      <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center mb-4">
        <img src={report.icon} alt="" className="w-6 h-6" />
      </div>
      <h2 className="text-lg font-semibold text-ink">{report.title}</h2>
      <p className="mt-1 text-sm text-neutral-500">{report.description}</p>
      {!isAvailable && (
        <span className="inline-block mt-3 text-xs font-medium text-neutral-500 bg-neutral-100 rounded-full px-3 py-1">
          Próximamente
        </span>
      )}
    </div>
  );

  if (!isAvailable) return card;
  return (
    <Link href={`${ROUTES.REPORTS}/${report.slug}`} className="block h-full">
      {card}
    </Link>
  );
}

export default async function ReportsHubPage() {
  const session = await getSession();
  if (!session) redirect(ROUTES.LOGIN);

  const reports = reportsForProfile(session.profile);
  if (reports.length === 0) redirect(ROUTES.DASHBOARD);

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Reportes</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Análisis y reportes disponibles para tu perfil
        </p>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => (
            <ReportCard key={report.slug} report={report} />
          ))}
        </section>
      </div>
    </main>
  );
}
