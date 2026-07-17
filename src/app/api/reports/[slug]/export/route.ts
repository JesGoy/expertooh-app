import { NextRequest } from 'next/server';
import { Workbook, type Worksheet } from 'exceljs';
import { getSession } from '@/infra/security/session';
import { makeGetComparisonReview } from '@/infra/container/reports';
import { canAccessReport } from '@/app/(protected)/reports/registry';
import { findComparisonConfig } from '@/app/(protected)/reports/_shared/comparison/config';
import { parseComparisonSearchParams, serializeYearMonth } from '@/app/(protected)/reports/_shared/comparison/searchParams';
import { BREAKDOWN_LABELS } from '@/app/(protected)/reports/_shared/comparison/labels';
import { InvalidComparisonFilters } from '@/core/domain/errors/ReportErrors';
import type { ComparisonReviewResult } from '@/core/application/usecases/GetComparisonReview';

// exceljs requiere Node (no Edge)
export const runtime = 'nodejs';

const NUM_FMT = '#,##0';
const PCT_FMT = '0.0%';

function styleHeaderRow(sheet: Worksheet) {
  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FF444F62' } };
  header.alignment = { vertical: 'middle' };
}

function addSummarySheet(workbook: Workbook, result: ComparisonReviewResult, columnLabel: string) {
  const showCategory = result.filters.kind === 'brand';
  const sheet = workbook.addWorksheet('Resumen');
  sheet.columns = [
    { header: columnLabel, key: 'entity', width: 28 },
    ...(showCategory ? [{ header: 'Categoría', key: 'category', width: 22 }] : []),
    { header: 'Caras', key: 'faces', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Soportes', key: 'elements', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Inversión CLP', key: 'investment', width: 18, style: { numFmt: NUM_FMT } },
    { header: 'm²', key: 'area', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Audiencia', key: 'audience', width: 14, style: { numFmt: NUM_FMT } },
    { header: 'SOV caras', key: 'sovFaces', width: 12, style: { numFmt: PCT_FMT } },
    { header: 'SOV inversión', key: 'sovInv', width: 14, style: { numFmt: PCT_FMT } },
    { header: 'SOV m²', key: 'sovArea', width: 12, style: { numFmt: PCT_FMT } },
    { header: 'SOV audiencia', key: 'sovAud', width: 14, style: { numFmt: PCT_FMT } },
    ...(showCategory ? [{ header: 'Propia', key: 'own', width: 10 }] : []),
  ];
  for (const e of result.entities) {
    sheet.addRow({
      entity: e.entityName,
      category: e.categoryName ?? '',
      faces: e.faces,
      elements: e.elements,
      investment: e.investmentCLP,
      area: e.areaM2,
      audience: e.audience,
      sovFaces: e.share.faces,
      sovInv: e.share.investmentCLP,
      sovArea: e.share.areaM2,
      sovAud: e.share.audience,
      own: e.isOwn ? 'Sí' : 'No',
    });
  }
  const totalRow = sheet.addRow({
    entity: 'TOTAL SET',
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
  columnLabel: string,
  entityNames: Map<number, string>,
  rows: Array<{ entityId: number; dimension: string; faces: number; elements: number; investmentCLP: number; areaM2: number; audience: number }>,
) {
  const sheet = workbook.addWorksheet(name);
  sheet.columns = [
    { header: columnLabel, key: 'entity', width: 28 },
    { header: dimensionHeader, key: 'dimension', width: 24 },
    { header: 'Caras', key: 'faces', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Soportes', key: 'elements', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Inversión CLP', key: 'investment', width: 18, style: { numFmt: NUM_FMT } },
    { header: 'm²', key: 'area', width: 12, style: { numFmt: NUM_FMT } },
    { header: 'Audiencia', key: 'audience', width: 14, style: { numFmt: NUM_FMT } },
  ];
  for (const row of rows) {
    sheet.addRow({
      entity: entityNames.get(row.entityId) ?? row.entityId,
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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<Response> {
  const { slug } = await params;
  const config = findComparisonConfig(slug);
  if (!config) return new Response('Reporte no encontrado', { status: 404 });

  const session = await getSession();
  if (!session || !canAccessReport(session.profile, slug)) {
    return new Response('No autorizado', { status: 401 });
  }

  const filters = parseComparisonSearchParams(config, Object.fromEntries(req.nextUrl.searchParams));
  if (!filters) {
    return new Response('Filtros inválidos', { status: 400 });
  }

  try {
    const result = await makeGetComparisonReview().execute(filters);

    const workbook = new Workbook();
    workbook.creator = 'ExpertooH';
    const entityNames = new Map(result.entities.map((e) => [e.entityId, e.entityName]));

    addSummarySheet(workbook, result, config.columnLabel);
    addBreakdownSheet(
      workbook,
      'Tendencia',
      'Período',
      config.columnLabel,
      entityNames,
      result.monthly.map((r) => ({ ...r, dimension: `${r.year}-${String(r.month).padStart(2, '0')}` })),
    );
    for (const breakdown of result.breakdowns) {
      const labels = BREAKDOWN_LABELS[breakdown.kind];
      addBreakdownSheet(
        workbook,
        labels.sheetName,
        labels.sheetHeader,
        config.columnLabel,
        entityNames,
        breakdown.rows.map((r) => ({ ...r, dimension: r.breakdownName })),
      );
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `${slug}_${serializeYearMonth(filters.from)}_${serializeYearMonth(filters.to)}.xlsx`;

    return new Response(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof InvalidComparisonFilters) {
      return new Response(err.message, { status: 400 });
    }
    throw err;
  }
}
