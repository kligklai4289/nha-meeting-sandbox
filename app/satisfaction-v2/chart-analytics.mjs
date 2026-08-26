import { normalizeDynamicScore, summarizeDynamic } from './dynamic-schema.mjs';

function text(value) {
  return String(value ?? '').trim();
}

function parseTimestamp(value) {
  const raw = text(value);
  if (!raw) return null;
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = raw.match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?\)/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0));
}

function dateKey(value) {
  const date = parseTimestamp(value);
  if (!date) return text(value).slice(0, 10) || 'ไม่ระบุวันที่';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function thaiDateLabel(key) {
  const date = new Date(`${key}T00:00:00`);
  if (Number.isNaN(date.getTime())) return key;
  return new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' }).format(date);
}

export function summarizeQuestionDistribution(rows = [], schema) {
  return schema.questionIndexes.map((columnIndex, position) => {
    const scores = rows
      .map((row) => normalizeDynamicScore(row[columnIndex]))
      .filter((score) => score !== null);
    const total = scores.length;
    return {
      index: position,
      columnIndex,
      label: schema.questionLabels[position],
      total,
      scores: [1, 2, 3, 4, 5].map((score) => {
        const count = scores.filter((value) => Math.round(value) === score).length;
        return { score, count, percent: total ? Number(((count / total) * 100).toFixed(1)) : 0 };
      }),
    };
  });
}

export function summarizeByOrganization(rows = [], schema) {
  const groups = new Map();
  rows.forEach((row) => {
    const organization = text(row[schema.organizationIndex]) || 'ไม่ระบุหน่วยงาน';
    if (!groups.has(organization)) groups.set(organization, []);
    groups.get(organization).push(row);
  });
  return Array.from(groups.entries())
    .map(([organization, groupRows]) => ({ organization, ...summarizeDynamic(groupRows, schema) }))
    .sort((a, b) => b.average - a.average || a.organization.localeCompare(b.organization, 'th'));
}

export function summarizeByDate(rows = [], schema) {
  const groups = new Map();
  rows.forEach((row) => {
    const key = dateKey(row[schema.timestampIndex]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return Array.from(groups.entries())
    .map(([key, groupRows]) => ({ dateKey: key, label: thaiDateLabel(key), ...summarizeDynamic(groupRows, schema) }))
    .sort((a, b) => a.dateKey.localeCompare(b.dateKey));
}
