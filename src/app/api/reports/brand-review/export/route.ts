import { NextRequest } from 'next/server';
import { Workbook, type Worksheet } from 'exceljs';
import { getSession } from '@/infra/security/session';
import { makeGetBrandReview } from '@/infra/container/reports';
import { canAccessReport } from '@/app/(protected)/reports/registry';
import { InvalidBrandReviewFilters } from '@/core/domain/errors/ReportErrors';
import type { BrandReviewResult } from '@/core/application/usecases/GetBrandReview';
import {
  parseBrandReviewSearchParams,
  serializeYearMonth,
} from '@/app/(protected)/reports/brand-review/searchParams';

// exceljs requiere Node (no Edge)
export const runtime = 'nodejs';

const REPORT_SLUG = 'brand-review';
const NUM_FMT = '#,##0';
const PCT_FMT = '0.0%';

function styleHeaderRow(sheet: Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FF444F62' } };
  header.alignment = { vertical: 'middle' };
}

function addSummarySheet(workbook: Workbook, result: BrandReviewResult, brandNames: Map<number, string>) {
  const sheet = workbook.addWorksheet('Resumen');
  sheet.columns = [
    { header: 'Marca', key: 'brand', width: 28 },
    { header: 'Categoría', key: 'category', width: 22 },
    { header: 'Caras', key: 'faces', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Soportes', key: 'elements', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Inversión CLP', key: 'investment', width: 18, style: { numFmt: NUM_FMT } },
    { header: 'm²', key: 'area', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Audiencia', key: 'audience', width: 14, style: { numFmt: NUM_FMT } },
    { header: 'SOV caras', key: 'sovFaces', width: 12, style: { numFmt: PCT_FMT } },
    { header: 'SOV inversión', key: 'sovInv', width: 14, style: { numFmt: PCT_FMT } },
    { header: 'SOV m²', key: 'sovArea', width: 12, style: { numFmt: PCT_FMT } },
    { header: 'SOV audiencia', key: 'sovAud', width: 14, style: { numFmt: PCT_FMT } },
    { header: 'Marca propia', key: 'own', width: 12 },
  ];
  for (const b of result.brands) {
    sheet.addRow({
      brand: b.brandName,
      category: b.categoryName ?? '',
      faces: b.faces,
      elements: b.elements,
      investment: b.investmentCLP,
      area: b.areaM2,
      audience: b.audience,
      sovFaces: b.share.faces,
      sovInv: b.share.investmentCLP,
      sovArea: b.share.areaM2,
      sovAud: b.share.audience,
      own: b.isOwn ? 'Sí' : 'No',
    });
    brandNames.set(b.brandId, b.brandName);
  }
  const totalRow = sheet.addRow({
    brand: 'TOTAL SET',
    faces: result.totals.faces,
    elements: result.totals.elements,
    investment: result.totals.investmentCLP,
    area: result.totals.areaM2,
    audience: result.totals.audience,
  });
  totalRow.font = { bold: true };
  styleHeaderRow(sheet);
}

function addBreakdownSheet(
  workbook: Workbook,
  name: string,
  dimensionHeader: string,
  rows: Array<{ brandId: number; dimension: string; faces: number; elements: number; investmentCLP: number; areaM2: number; audience: number }>,
  brandNames: Map<number, string>,
) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: 'Marca', key: 'brand', width: 28 },
    { header: dimensionHeader, key: 'dimension', width: 24 },
    { header: 'Caras', key: 'faces', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Soportes', key: 'elements', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Inversión CLP', key: 'investment', width: 18, style: { numFmt: NUM_FMT } },
    { header: 'm²', key: 'area', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Audiencia', key: 'audience', width: 14, style: { numFmt: NUM_FMT } },
  ];
  for (const row of rows) {
    sheet.addRow({
      brand: brandNames.get(row.brandId) ?? row.brandId,
      dimension: row.dimension,
      faces: row.faces,
      elements: row.elements,
      investment: row.investmentCLP,
      area: row.areaM2,
      audience: row.audience,
    });
  }
  styleHeaderRow(sheet);
}

export async function GET(req: NextRequest): Promise<Response> {
  const session = await getSession();
  if (!session || !canAccessReport(session.profile, REPORT_SLUG)) {
    return new Response('No autorizado', { status: 401 });
  }

  const filters = parseBrandReviewSearchParams(Object.fromEntries(req.nextUrl.searchParams));
  if (!filters) {
    return new Response('Filtros inválidos', { status: 400 });
  }

  try {
    const result = await makeGetBrandReview().execute(filters);

    const workbook = new Workbook();
    workbook.creator = 'ExpertooH';
    const brandNames = new Map<number, string>();

    addSummarySheet(workbook, result, brandNames);
    addBreakdownSheet(
      workbook,
      'Tendencia',
      'Período',
      result.monthly.map((r) => ({ ...r, dimension: `${r.year}-${String(r.month).padStart(2, '0')}` })),
      brandNames,
    );
    addBreakdownSheet(
      workbook,
      'Geografía',
      result.geo.level === 'region' ? 'Región' : 'Comuna',
      result.geo.rows.map((r) => ({ ...r, dimension: r.geoName })),
      brandNames,
    );
    addBreakdownSheet(
      workbook,
      'Formatos',
      'Formato',
      result.formats.map((r) => ({ ...r, dimension: r.typeName })),
      brandNames,
    );

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `brand-review_${serializeYearMonth(filters.from)}_${serializeYearMonth(filters.to)}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof InvalidBrandReviewFilters) {
      return new Response(err.message, { status: 400 });
    }
    throw err;
  }
}
