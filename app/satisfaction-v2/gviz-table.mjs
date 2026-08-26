function text(value) {
  return String(value ?? '').trim();
}

function cellText(cell) {
  return cell ? text(cell.f ?? cell.v ?? '') : '';
}

export function parseGvizTable(response = {}) {
  const columns = response?.table?.cols || [];
  const sourceRows = response?.table?.rows || [];
  const headers = columns.map((column, index) => text(column?.label || column?.id || `คอลัมน์ ${index + 1}`));
  const width = Math.max(headers.length, ...sourceRows.map((row) => row?.c?.length || 0), 0);
  const normalizedHeaders = Array.from({ length: width }, (_, index) => headers[index] || `คอลัมน์ ${index + 1}`);
  const rows = sourceRows
    .map((row) => Array.from({ length: width }, (_, index) => cellText(row?.c?.[index])))
    .filter((row) => row.some((value) => value !== ''));
  return { headers: normalizedHeaders, rows, columns: width };
}
