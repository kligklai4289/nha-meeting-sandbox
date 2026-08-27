'use client';

import { useRef } from 'react';
import { Download, FileSpreadsheet, FileText, Printer } from 'lucide-react';
import { buildCsv, buildExcelHtml, buildExportFilename } from './export-utils.mjs';
import './export-menu.css';

type FieldSummary = {
  label: string;
  role: string;
  responses: number;
  responseRate: number;
  uniqueCount?: number;
  average?: number;
  satisfactionPercent?: number;
  positiveRate?: number;
  values?: Array<{ value: string; count: number; percent: number }>;
};

type Summary = {
  respondents: number;
  average: number;
  satisfactionPercent: number;
  positiveRate: number;
  fieldSummaries?: FieldSummary[];
};

type Source = { title: string; subtitle: string };

function localDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function download(content: string, mime: string, filename: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function ExportMenu({
  source,
  headers,
  rows,
  summary,
  dateLabel,
  organizationLabel,
}: {
  source: Source;
  headers: string[];
  rows: string[][];
  summary: Summary;
  dateLabel: string;
  organizationLabel: string;
}) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const close = () => { if (detailsRef.current) detailsRef.current.open = false; };
  const date = localDateKey();
  const filters = [`วันที่: ${dateLabel}`, `หน่วยงาน: ${organizationLabel}`];

  const exportExcel = () => {
    const html = buildExcelHtml({
      title: source.title,
      subtitle: source.subtitle,
      filters,
      headers,
      rows,
      summary,
      fieldSummaries: summary.fieldSummaries || [],
    });
    download(html, 'application/vnd.ms-excel;charset=utf-8', buildExportFilename(source.title, date, 'xls'));
    close();
  };

  const exportCsv = () => {
    download(buildCsv(headers, rows), 'text/csv;charset=utf-8', buildExportFilename(source.title, date, 'csv'));
    close();
  };

  const printPdf = () => {
    close();
    const previousTitle = document.title;
    document.title = source.title;
    window.print();
    window.setTimeout(() => { document.title = previousTitle; }, 0);
  };

  return <details className="satv2-export" ref={detailsRef}>
    <summary><Download size={16}/> Export</summary>
    <div className="satv2-export-menu">
      <button type="button" onClick={exportExcel}><FileSpreadsheet size={17}/><span><strong>Excel (.xls)</strong><small>สรุป + วิเคราะห์รายฟิลด์ + ข้อมูลดิบ</small></span></button>
      <button type="button" onClick={exportCsv}><FileText size={17}/><span><strong>CSV</strong><small>ข้อมูลดิบตามตัวกรองปัจจุบัน</small></span></button>
      <button type="button" onClick={printPdf}><Printer size={17}/><span><strong>Print / PDF</strong><small>พิมพ์ Dashboard หรือบันทึกเป็น PDF</small></span></button>
    </div>
  </details>;
}
