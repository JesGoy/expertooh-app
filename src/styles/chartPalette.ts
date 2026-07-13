/**
 * Paleta categórica para gráficos de reportes.
 * Orden FIJO — nunca ciclar. Validada para daltonismo (CVD-safe) sobre fondo blanco.
 * El color sigue a la marca: calcular el mapa una vez por página con assignBrandColors()
 * y usarlo en todos los charts, chips y leyendas.
 */
export const CHART_CATEGORICAL = [
  '#ff6600', // brand — slot 1: siempre la primera marca propia
  '#2a78d6', // azul
  '#0f9d68', // verde
  '#c88500', // ámbar
  '#0891b2', // teal
  '#4a3aa7', // índigo
  '#e34948', // rojo
  '#d8578c', // rosa
] as const;

/** Para "SIN PUBLICIDAD" / agrupación "Otras" (derivado de ink) */
export const CHART_NEUTRAL = '#8a93a3';
export const CHART_GRID = '#eaeaea';
export const CHART_AXIS_TEXT = '#444f62';

const UNBRANDED_NAME = 'SIN PUBLICIDAD';

/**
 * Asigna un color estable a cada marca del set: propias primero,
 * luego el resto en el orden recibido. "SIN PUBLICIDAD" siempre neutral.
 */
export function assignBrandColors(
  brands: Array<{ brandId: number; brandName: string; isOwn: boolean }>,
): Map<number, string> {
  const ordered = [...brands].sort((a, b) => (a.isOwn === b.isOwn ? 0 : a.isOwn ? -1 : 1));
  const map = new Map<number, string>();
  let slot = 0;
  for (const brand of ordered) {
    if (brand.brandName === UNBRANDED_NAME) {
      map.set(brand.brandId, CHART_NEUTRAL);
      continue;
    }
    map.set(brand.brandId, CHART_CATEGORICAL[slot % CHART_CATEGORICAL.length]);
    slot++;
  }
  return map;
}
