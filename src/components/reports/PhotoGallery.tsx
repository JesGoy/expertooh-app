import { formatDate } from '@/lib/formatters';

export interface PhotoItem {
  recordId: number;
  photoUrl: string;
  capturedAt: Date | null;
  address: string | null;
  communeName: string | null;
  providerName: string | null;
}

export interface PhotoGroup {
  brandId: number;
  brandName: string;
  color: string;
  photos: PhotoItem[];
}

interface PhotoGalleryProps {
  groups: PhotoGroup[];
  emptyMessage?: string;
}

function isVideo(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

export default function PhotoGallery({ groups, emptyMessage }: PhotoGalleryProps) {
  const withPhotos = groups.filter((g) => g.photos.length > 0);

  if (withPhotos.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        {emptyMessage ?? 'Sin evidencia fotográfica disponible para el período seleccionado.'}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {withPhotos.map((group) => (
        <div key={group.brandId}>
          <div className="flex items-center gap-2 mb-3">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: group.color }}
              aria-hidden="true"
            />
            <h4 className="text-sm font-medium text-ink">{group.brandName}</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {group.photos.map((photo) => (
              <figure key={photo.recordId} className="rounded-xl overflow-hidden border border-neutral-200 bg-white">
                {isVideo(photo.photoUrl) ? (
                  <video src={photo.photoUrl} className="w-full h-28 object-cover" muted controls preload="metadata" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.photoUrl}
                    alt={`${group.brandName} — ${photo.address ?? 'sin dirección'}`}
                    className="w-full h-28 object-cover"
                    loading="lazy"
                  />
                )}
                <figcaption className="p-2 text-[11px] leading-tight text-neutral-500">
                  <span className="block truncate text-neutral-700">{photo.address ?? '—'}</span>
                  <span className="block truncate">
                    {photo.communeName ?? '—'} · {formatDate(photo.capturedAt)}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
