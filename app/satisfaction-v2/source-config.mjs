export const DEFAULT_SOURCE = Object.freeze({
  sheetId: '1RFzHpDKLDNZSvd20nMoZIqeLo0Zt9LOGrI6YPPQclJ8',
  sheetName: 'Form Responses 1',
  title: 'ผลประเมินความพึงพอใจการจัดประชุม',
  subtitle: 'คณะอนุกรรมการ อปสข./อคม. เขต 4 สระบุรี · 27 ส.ค. 2569',
});

export function extractSheetId(value) {
  const text = String(value ?? '').trim();
  if (!text) return '';
  const match = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  return /^[a-zA-Z0-9_-]{3,}$/.test(text) ? text : '';
}

export function normalizeSource(input = {}) {
  const sheetId = extractSheetId(input.sheetId || input.sheetUrl) || DEFAULT_SOURCE.sheetId;
  return {
    sheetId,
    sheetName: String(input.sheetName || DEFAULT_SOURCE.sheetName).trim() || DEFAULT_SOURCE.sheetName,
    title: String(input.title || DEFAULT_SOURCE.title).trim() || DEFAULT_SOURCE.title,
    subtitle: String(input.subtitle || DEFAULT_SOURCE.subtitle).trim() || DEFAULT_SOURCE.subtitle,
  };
}

export function buildGvizUrl(source, callbackName, cacheBust = Date.now()) {
  const normalized = normalizeSource(source);
  const tqx = `out:json;responseHandler:${callbackName}`;
  return `https://docs.google.com/spreadsheets/d/${normalized.sheetId}/gviz/tq?sheet=${encodeURIComponent(normalized.sheetName)}&headers=1&tqx=${encodeURIComponent(tqx)}&_=${cacheBust}`;
}

export function buildShareParams(source) {
  const normalized = normalizeSource(source);
  return new URLSearchParams({
    sheetId: normalized.sheetId,
    sheetName: normalized.sheetName,
    title: normalized.title,
    subtitle: normalized.subtitle,
  }).toString();
}
