import type { ComparisonEntityKind, ComparisonFilterKey } from '@/core/domain/constants/comparison';

/** Un nivel seleccionable dentro de un reporte (p.ej. Región | Comuna) */
export interface ComparisonLevel {
  kind: ComparisonEntityKind;
  label: string;
}

/** Configuración de presentación de un reporte de comparación. Solo datos serializables. */
export interface ComparisonReportConfig {
  slug: string;
  entityLabels: { singular: string; plural: string };
  /** Encabezado de la columna de entidad en las tablas comparativas */
  columnLabel: string;
  /** length > 1 habilita el LevelSwitch (p.ej. Región|Comuna) */
  levels: ComparisonLevel[];
  /** Nombre del query param con el set de ids ('brands' conserva compat de URL) */
  idsParam: string;
  /** Filtros del panel que se ocultan porque coinciden con la dimensión comparada */
  hiddenFilters: ComparisonFilterKey[];
  pickerPlaceholder: string;
}

export const BRAND_REVIEW_CONFIG: ComparisonReportConfig = {
  slug: 'brand-review',
  entityLabels: { singular: 'marca', plural: 'marcas' },
  columnLabel: 'Marca',
  levels: [{ kind: 'brand', label: 'Marca' }],
  idsParam: 'brands',
  hiddenFilters: [],
  pickerPlaceholder: 'Buscar marca o categoría…',
};

export const FORMAT_REVIEW_CONFIG: ComparisonReportConfig = {
  slug: 'format-review',
  entityLabels: { singular: 'formato', plural: 'formatos' },
  columnLabel: 'Formato',
  levels: [{ kind: 'type', label: 'Formato' }],
  idsParam: 'ids',
  hiddenFilters: ['typeId'],
  pickerPlaceholder: 'Buscar formato…',
};

export const TERRITORY_REVIEW_CONFIG: ComparisonReportConfig = {
  slug: 'territory-review',
  entityLabels: { singular: 'territorio', plural: 'territorios' },
  columnLabel: 'Territorio',
  levels: [
    { kind: 'region', label: 'Región' },
    { kind: 'commune', label: 'Comuna' },
  ],
  idsParam: 'ids',
  hiddenFilters: ['regionId', 'communeId'],
  pickerPlaceholder: 'Buscar región o comuna…',
};

export const CATEGORY_REVIEW_CONFIG: ComparisonReportConfig = {
  slug: 'category-review',
  entityLabels: { singular: 'categoría', plural: 'categorías' },
  columnLabel: 'Categoría',
  levels: [{ kind: 'category', label: 'Categoría' }],
  idsParam: 'ids',
  hiddenFilters: ['categoryId'],
  pickerPlaceholder: 'Buscar categoría…',
};

export const COMPARISON_REPORTS: ComparisonReportConfig[] = [
  BRAND_REVIEW_CONFIG,
  FORMAT_REVIEW_CONFIG,
  TERRITORY_REVIEW_CONFIG,
  CATEGORY_REVIEW_CONFIG,
];

export function findComparisonConfig(slug: string): ComparisonReportConfig | undefined {
  return COMPARISON_REPORTS.find((c) => c.slug === slug);
}
