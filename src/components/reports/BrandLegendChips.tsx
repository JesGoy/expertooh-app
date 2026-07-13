interface LegendBrand {
  brandId: number;
  name: string;
  color: string;
  isOwn: boolean;
}

interface BrandLegendChipsProps {
  brands: LegendBrand[];
}

export default function BrandLegendChips({ brands }: BrandLegendChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {brands.map((brand) => (
        <span
          key={brand.brandId}
          className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-ink"
        >
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: brand.color }}
            aria-hidden="true"
          />
          {brand.name}
          {brand.isOwn && <span className="text-neutral-400">· propia</span>}
        </span>
      ))}
    </div>
  );
}
