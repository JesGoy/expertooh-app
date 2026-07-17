import { redirect } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

// Ruta antigua: el reporte de Marcas vive ahora dentro del módulo de Reportes.
export default function LegacyBrandReviewPage() {
  redirect(ROUTES.REPORT_BRAND_REVIEW);
}
