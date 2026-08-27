function text(value) {
  return String(value ?? '');
}

function csvCell(value) {
  const raw = text(value);
  if (/[",\r\n]/.test(raw)) return `"${raw.replaceAll('"', '""')}"`;
  return raw;
}

function escapeHtml(value) {
  return text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function pct(value, digits = 1) {
  const number = Number(value || 0);
  return `${number.toFixed(digits)}%`;
}

/**
 * @param {Array<unknown>} headers
 * @param {Array<Array<unknown>>} rows
 */
export function buildCsv(headers = [], rows = []) {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
  return `\uFEFF${lines.join('\r\n')}`;
}

/**
 * @param {unknown} title
 * @param {unknown} dateKey
 * @param {unknown} extension
 */
export function buildExportFilename(title, dateKey, extension) {
  const safeTitle = text(title || 'satisfaction')
    .normalize('NFKC')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'satisfaction';
  const safeDate = text(dateKey || '').replace(/[^0-9-]/g, '') || 'export';
  const safeExt = text(extension || 'csv').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'csv';
  return `${safeTitle}_${safeDate}.${safeExt}`;
}

function fieldSummaryRow(field = {}) {
  const role = field.role || 'category';
  let detail = '';
  if (role === 'score') {
    detail = `เฉลี่ย ${Number(field.average || 0).toFixed(2)} / 5 | ความพึงพอใจ ${pct(field.satisfactionPercent)} | Positive Rate ${pct(field.positiveRate)}`;
  } else if (role === 'organization' || role === 'category') {
    detail = (field.values || []).slice(0, 8).map((item) => `${item.value}: ${item.count} (${pct(item.percent)})`).join(' | ');
  } else if (role === 'comment') {
    detail = `ข้อความ ${field.responses || 0} | Response Rate ${pct(field.responseRate)}`;
  } else {
    detail = `ข้อมูล ${field.responses || 0} | ค่าที่พบ ${field.uniqueCount || 0}`;
  }
  return `<tr><td>${escapeHtml(field.label)}</td><td>${escapeHtml(role)}</td><td>${Number(field.responses || 0)}</td><td>${pct(field.responseRate)}</td><td>${escapeHtml(detail)}</td></tr>`;
}

/**
 * @param {{
 *  title?: unknown,
 *  subtitle?: unknown,
 *  filters?: Array<unknown>,
 *  headers?: Array<unknown>,
 *  rows?: Array<Array<unknown>>,
 *  summary?: Record<string, any>,
 *  fieldSummaries?: Array<Record<string, any>>
 * }} payload
 */
export function buildExcelHtml(payload = {}) {
  const { title = '', subtitle = '', filters = [], headers = [], rows = [], summary = {}, fieldSummaries = [] } = payload;
  const summaryRows = [
    ['ผู้ตอบ', Number(summary.respondents || 0)],
    ['คะแนนเฉลี่ย', summary.respondents ? `${Number(summary.average || 0).toFixed(2)} / 5` : '—'],
    ['ความพึงพอใจ', summary.respondents ? pct(summary.satisfactionPercent) : '—'],
    ['Positive Rate', summary.respondents ? pct(summary.positiveRate) : '—'],
  ];
  const rawHeader = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const rawRows = rows.map((row) => `<tr>${headers.map((_, index) => `<td>${escapeHtml(row[index] ?? '')}</td>`).join('')}</tr>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,'Noto Sans Thai',sans-serif;color:#1d2f40}h1{font-size:20px;margin:0 0 4px}p{margin:0 0 14px;color:#607080}
    table{border-collapse:collapse;margin:12px 0 24px;width:100%}th,td{border:1px solid #cfd9e2;padding:7px 9px;text-align:left;vertical-align:top}th{background:#eaf4f8;font-weight:700}.section{background:#0b6c91;color:#fff;font-weight:700}
  </style></head><body>
    <h1>${escapeHtml(title)}</h1><p>${escapeHtml(subtitle)}</p>
    <table><tr><th colspan="2" class="section">ตัวกรองที่ใช้</th></tr>${filters.map((item) => `<tr><td colspan="2">${escapeHtml(item)}</td></tr>`).join('')}</table>
    <table><tr><th colspan="2" class="section">สรุปภาพรวม</th></tr>${summaryRows.map(([label,value]) => `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(value)}</td></tr>`).join('')}</table>
    <table><tr><th colspan="5" class="section">วิเคราะห์รายฟิลด์</th></tr><tr><th>ฟิลด์</th><th>ประเภท</th><th>จำนวนคำตอบ</th><th>Response Rate</th><th>รายละเอียด</th></tr>${fieldSummaries.map(fieldSummaryRow).join('')}</table>
    <table><tr><th colspan="${Math.max(1, headers.length)}" class="section">ข้อมูลตามตัวกรอง (${rows.length} แถว)</th></tr><tr>${rawHeader}</tr>${rawRows}</table>
  </body></html>`;
}
