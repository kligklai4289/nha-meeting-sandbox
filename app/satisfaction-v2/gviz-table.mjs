const HEADER_MARKERS = [
  'timestamp',
  'ประทับเวลา',
  'หน่วยงาน',
  'สังกัด',
  'ข้อเสนอแนะ',
  'ข้อเสนอ',
  'ข้อคิดเห็น',
  'ความคิดเห็น',
  'คำแนะนำ',
  'comment',
  'suggestion',
  'feedback',
];

function text(value) {
  return String(value ?? '').trim();
}

function cellText(cell) {
  return cell ? text(cell.f ?? cell.v ?? '') : '';
}

function containsHeaderMarker(value) {
  const normalized = text(value).toLowerCase();
  return HEADER_MARKERS.some((marker) => normalized.includes(marker.toLowerCase()));
}

function looksLikeHeaderRow(row = []) {
  if (!row.length) return false;
  const first = text(row[0]).toLowerCase();
  const explicitTimeHeader = first === 'timestamp' || first.includes('ประทับเวลา');
  const markerHits = row.filter((value) => containsHeaderMarker(value)).length;
  return explicitTimeHeader || markerHits >= 2;
}

export function parseGvizTable(response = {}) {
  const columns = response?.table?.cols || [];
  const sourceRows = response?.table?.rows || [];
  const width = Math.max(columns.length, ...sourceRows.map((row) => row?.c?.length || 0), 0);
  const rawLabels = Array.from({ length: width }, (_, index) => text(columns[index]?.label));
  const fallbackHeaders = Array.from({ length: width }, (_, index) => text(columns[index]?.label || columns[index]?.id || `คอลัมน์ ${index + 1}`));
  let rows = sourceRows
    .map((row) => Array.from({ length: width }, (_, index) => cellText(row?.c?.[index])))
    .filter((row) => row.some((value) => value !== ''));

  const hasRealLabels = rawLabels.some(Boolean);
  const shouldPromoteFirstRow = !hasRealLabels && rows.length > 0 && looksLikeHeaderRow(rows[0]);
  const headers = shouldPromoteFirstRow
    ? Array.from({ length: width }, (_, index) => rows[0][index] || fallbackHeaders[index] || `คอลัมน์ ${index + 1}`)
    : fallbackHeaders;

  if (shouldPromoteFirstRow) rows = rows.slice(1);

  return { headers, rows, columns: width, promotedHeaderRow: shouldPromoteFirstRow };
}
