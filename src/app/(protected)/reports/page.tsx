import { makeListElementRecords } from '@/infra/container/auth';

function formatCLP(value: unknown) {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  if (!isFinite(n)) return '-';
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n);
}

function formatDate(d: unknown) {
  if (!d) return '-';
  const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : (d as Date);
  if (isNaN(new Date(date).getTime())) return '-';
  return new Date(date).toLocaleString('es-CL');
}

export default async function ReportsPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const params = (await searchParams) || {};
  const list = makeListElementRecords();
  const page = Number((params.page as string) || 1) || 1;
  const pageSize = Number((params.pageSize as string) || 20) || 20;
  const providerId = Number(params.providerId) || undefined;
  const typeId = Number(params.typeId) || undefined;
  const communeId = Number(params.communeId) || undefined;
  const brandName = typeof params.brandName === 'string' ? (params.brandName as string) : undefined;
  const year = Number(params.year) || undefined;
  const month = Number(params.month) || undefined;

  const { items, total } = await list.execute({ page, pageSize, providerId, typeId, communeId, brandName, year, month });

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Element Records</h1>
        <p className="mt-1 text-sm text-neutral-500">Listado con filtros y paginación</p>

        <form className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-3">
          <input name="brandName" placeholder="Marca contiene…" defaultValue={brandName ?? ''} className="border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          <input name="providerId" placeholder="Provider ID" defaultValue={providerId ?? ''} className="border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          <input name="typeId" placeholder="Type ID" defaultValue={typeId ?? ''} className="border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          <input name="communeId" placeholder="Commune ID" defaultValue={communeId ?? ''} className="border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          <input name="year" placeholder="Año" defaultValue={year ?? ''} className="border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
          <div className="flex gap-2">
            <input name="month" placeholder="Mes (1-12)" defaultValue={month ?? ''} className="w-full border border-neutral-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30" />
            <button type="submit" className="btn btn-primary text-xs px-3 py-2">Filtrar</button>
          </div>
        </form>

    <div className="mt-6 overflow-auto rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur">
          <table className="w-full text-sm">
      <thead className="sticky top-0 bg-neutral-50/90 backdrop-blur text-neutral-600">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Fecha</th>
                <th className="text-left px-3 py-2 font-medium">Marca</th>
                <th className="text-left px-3 py-2 font-medium">Categoría</th>
                <th className="text-left px-3 py-2 font-medium">Proveedor</th>
                <th className="text-left px-3 py-2 font-medium">Tipo</th>
                <th className="text-left px-3 py-2 font-medium">Dirección</th>
                <th className="text-left px-3 py-2 font-medium">Comuna</th>
                <th className="text-right px-3 py-2 font-medium">Valor</th>
                <th className="text-right px-3 py-2 font-medium">m²</th>
                <th className="text-left px-3 py-2 font-medium">Foto</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-10 text-center text-neutral-500">No hay registros para los filtros seleccionados.</td>
                </tr>
              ) : (
                items.map((it) => (
                  <tr key={it.id} className="odd:bg-neutral-50/60 even:bg-white hover:bg-neutral-100/60 transition-colors">
                    <td className="px-3 py-2 text-neutral-700 whitespace-nowrap">{formatDate(it.capturedAt)}</td>
                    <td className="px-3 py-2 text-neutral-700">
                      <span className="inline-flex items-center rounded-full bg-brand/10 text-brand px-2 py-0.5 text-xs font-medium">
                        {it.brandName || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      <span className="inline-flex items-center rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 text-xs">
                        {it.categoryName || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-neutral-700">{it.providerName}</td>
                    <td className="px-3 py-2 text-neutral-700">{it.typeName}</td>
                    <td className="px-3 py-2 text-neutral-700 max-w-[320px] truncate" title={it.address || undefined}>{it.address}</td>
                    <td className="px-3 py-2 text-neutral-700">{it.communeName}</td>
                    <td className="px-3 py-2 text-neutral-700 text-right tabular-nums">{formatCLP(it.valueCLP)}</td>
                    <td className="px-3 py-2 text-neutral-700 text-right tabular-nums">{typeof it.areaM2 === 'number' ? it.areaM2.toFixed(2) : '-'}</td>
                    <td className="px-3 py-2 text-neutral-700">{it.photoUrl ? <a href={it.photoUrl} className="text-brand hover:underline" target="_blank">Abrir</a> : '-'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <div>
            Página {page} de {pages} • {total} registros
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a className="px-3 py-1.5 border rounded hover:bg-neutral-50" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])), page: String(page - 1), pageSize: String(pageSize) }).toString()}`}>Anterior</a>
            )}
            {page < pages && (
              <a className="px-3 py-1.5 border rounded hover:bg-neutral-50" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k,v]) => [k, String(v)])), page: String(page + 1), pageSize: String(pageSize) }).toString()}`}>Siguiente</a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
