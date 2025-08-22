import { getSession } from '@/infra/security/session';
import { logoutAction } from '@/app/(auth)/actions';

export default async function DashboardPage() {
  const session = await getSession();
  const userName = session?.username ?? 'Usuario';

  return (
  <main className="min-h-[100dvh] bg-gradient-to-b from-white to-neutral-50">

  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-neutral-500">Resumen de tus campañas y KPIs clave</p>

        <section className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Impresiones', value: '1.2M', delta: '+3.2%' },
            { label: 'Alcance', value: '420k', delta: '+1.1%' },
            { label: 'CPM', value: '$3.45', delta: '-0.4%' },
            { label: 'CTR', value: '1.24%', delta: '+0.2%' },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-4">
              <div className="text-xs text-neutral-500">{k.label}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-xl font-semibold text-ink">{k.value}</div>
                <div className="text-xs text-green-600">{k.delta}</div>
              </div>
            </div>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-ink">Rendimiento semanal</h2>
              <div className="text-xs text-neutral-500">Últimos 7 días</div>
            </div>
            <div className="h-48 grid place-items-center text-neutral-400 text-xs">[Gráfico de ejemplo]</div>
          </div>
          <div className="rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-4">
            <h2 className="text-sm font-medium text-ink mb-3">Reportes recientes</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-neutral-600">Campaña Lima Centro</span>
                <span className="text-xs text-neutral-500">hoy</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-neutral-600">Awareness Q3 - Retail</span>
                <span className="text-xs text-neutral-500">ayer</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-neutral-600">Performance OOH - Sur</span>
                <span className="text-xs text-neutral-500">hace 3 días</span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
