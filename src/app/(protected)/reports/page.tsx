import { makeListElementRecords } from '@/infra/container/auth';

export default async function ReportsPage({ searchParams }: { searchParams?: Record<string, string | string[] | undefined> }) {
  const list = makeListElementRecords();
  const page = Number((searchParams?.page as string) || 1) || 1;
  const pageSize = Number((searchParams?.pageSize as string) || 20) || 20;
  const providerId = Number(searchParams?.providerId) || undefined;
  const typeId = Number(searchParams?.typeId) || undefined;
  const communeId = Number(searchParams?.communeId) || undefined;
  const brandName = typeof searchParams?.brandName === 'string' ? (searchParams!.brandName as string) : undefined;
  const year = Number(searchParams?.year) || undefined;
  const month = Number(searchParams?.month) || undefined;

  const { items, total } = await list.execute({ page, pageSize, providerId, typeId, communeId, brandName, year, month });

  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Element Records</h1>
        <p className="mt-1 text-sm text-neutral-500">Listado con filtros y paginación</p>

        <form className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input name="brandName" placeholder="Marca contiene…" defaultValue={brandName ?? ''} className="border rounded px-3 py-2 text-sm" />
          <input name="providerId" placeholder="Provider ID" defaultValue={providerId ?? ''} className="border rounded px-3 py-2 text-sm" />
          <input name="typeId" placeholder="Type ID" defaultValue={typeId ?? ''} className="border rounded px-3 py-2 text-sm" />
          <input name="communeId" placeholder="Commune ID" defaultValue={communeId ?? ''} className="border rounded px-3 py-2 text-sm" />
          <input name="year" placeholder="Año" defaultValue={year ?? ''} className="border rounded px-3 py-2 text-sm" />
          <input name="month" placeholder="Mes (1-12)" defaultValue={month ?? ''} className="border rounded px-3 py-2 text-sm" />
          <button type="submit" className="btn btn-primary text-xs px-3 py-2">Filtrar</button>
        </form>

        <div className="mt-6 overflow-auto rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="text-left px-3 py-2">Fecha</th>
                <th className="text-left px-3 py-2">Marca</th>
                <th className="text-left px-3 py-2">Categoría</th>
                <th className="text-left px-3 py-2">Proveedor</th>
                <th className="text-left px-3 py-2">Tipo</th>
                <th className="text-left px-3 py-2">Dirección</th>
                <th className="text-left px-3 py-2">Comuna</th>
                <th className="text-left px-3 py-2">Valor</th>
                <th className="text-left px-3 py-2">m²</th>
                <th className="text-left px-3 py-2">Foto</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-t border-neutral-200/60">
                  <td className="px-3 py-2 text-neutral-700">{it.capturedAt ? new Date(it.capturedAt).toLocaleString() : '-'}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.brandName}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.categoryName}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.providerName}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.typeName}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.address}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.communeName}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.valueCLP ?? '-'}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.areaM2 ?? '-'}</td>
                  <td className="px-3 py-2 text-neutral-700">{it.photoUrl ? <a href={it.photoUrl} className="text-brand" target="_blank">ver</a> : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
          <div>
            Página {page} de {pages} • {total} registros
          </div>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a className="px-3 py-1.5 border rounded" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams || {}).map(([k,v]) => [k, String(v)])), page: String(page - 1), pageSize: String(pageSize) }).toString()}`}>Anterior</a>
            )}
            {page < pages && (
              <a className="px-3 py-1.5 border rounded" href={`?${new URLSearchParams({ ...Object.fromEntries(Object.entries(searchParams || {}).map(([k,v]) => [k, String(v)])), page: String(page + 1), pageSize: String(pageSize) }).toString()}`}>Siguiente</a>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
