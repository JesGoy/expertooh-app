'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Button } from '@/components/ui';
import type { ReactNode } from 'react';

interface PrintableReportProps {
  /** Query string de los filtros actuales (misma URL que la página) */
  queryString: string;
  documentTitle: string;
  children: ReactNode;
}

const EXPORT_ENDPOINT = '/api/reports/brand-review/export';

export default function PrintableReport({ queryString, documentTitle, children }: PrintableReportProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef, documentTitle });

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-2 print-hidden">
        <a
          href={`${EXPORT_ENDPOINT}?${queryString}`}
          download
          className="inline-flex items-center rounded-2xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-neutral-50 transition-colors"
        >
          Exportar Excel
        </a>
        <Button size="sm" onClick={() => handlePrint()}>
          Exportar PDF
        </Button>
      </div>
      <div ref={contentRef} className="print-container">
        {children}
      </div>
    </div>
  );
}
