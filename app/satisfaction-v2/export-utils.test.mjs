import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCsv, buildExcelHtml, buildExportFilename } from './export-utils.mjs';

test('buildCsv preserves Thai headers and safely quotes commas, quotes, and newlines', () => {
  const csv = buildCsv(['หน่วยงาน', 'ความคิดเห็น'], [['รพ.สระบุรี', 'ดี, มาก'], ['A', 'บรรทัด 1\n"บรรทัด 2"']]);
  assert.equal(csv, '\uFEFFหน่วยงาน,ความคิดเห็น\r\nรพ.สระบุรี,"ดี, มาก"\r\nA,"บรรทัด 1\n""บรรทัด 2"""');
});

test('buildExcelHtml includes dashboard summary, filters, field analytics, and raw data', () => {
  const html = buildExcelHtml({
    title: 'ผลประเมิน', subtitle: 'ประชุม A', filters: ['วันที่: ทั้งหมด', 'หน่วยงาน: A'],
    headers: ['Timestamp', 'หน่วยงาน', 'Q1'], rows: [['2026-08-27', 'A', '5']],
    summary: { respondents: 1, average: 5, satisfactionPercent: 100, positiveRate: 100 },
    fieldSummaries: [{ label: 'Q1', role: 'score', responses: 1, responseRate: 100, average: 5, satisfactionPercent: 100, positiveRate: 100 }],
  });
  assert.match(html, /ผลประเมิน/);
  assert.match(html, /หน่วยงาน: A/);
  assert.match(html, /Q1/);
  assert.match(html, /100\.0%/);
  assert.match(html, /2026-08-27/);
});

test('buildExportFilename creates a safe dated filename', () => {
  assert.equal(buildExportFilename('ผลประเมิน / เขต 4', '2026-08-27', 'xls'), 'ผลประเมิน-เขต-4_2026-08-27.xls');
});


test('buildCsv prevents spreadsheet formula execution from exported text', () => {
  const csv = buildCsv(['ความคิดเห็น'], [['=HYPERLINK("https://example.com")'], ['+cmd'], ['@SUM(A1:A2)']]);
  assert.match(csv, /'=HYPERLINK/);
  assert.match(csv, /'\+cmd/);
  assert.match(csv, /'@SUM/);
});
