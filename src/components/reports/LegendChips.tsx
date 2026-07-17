interface LegendEntity {
  entityId: number;
  name: string;
  color: string;
  isOwn: boolean;
}

interface LegendChipsProps {
  entities: LegendEntity[];
}

export default function LegendChips({ entities }: LegendChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {entities.map((entity) => (
        <span
          key={entity.entityId}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-ink"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: entity.color }}
            aria-hidden="true"
          />
          {entity.name}
          {entity.isOwn && <span className="text-neutral-400">· propia</span>}
        </span>
      ))}
    </div>
  );
}
