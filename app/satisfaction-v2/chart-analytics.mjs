import { normalizeDynamicScore, summarizeDynamic } from './dynamic-schema.mjs';

const POSITIVE_KEYWORDS = ['ดี', 'ดีมาก', 'เยี่ยม', 'ประทับใจ', 'ชอบ', 'เหมาะสม', 'สะดวก', 'พอใจ', 'ขอบคุณ'];
const SUGGESTION_KEYWORDS = ['ควร', 'อยาก', 'เพิ่ม', 'ลด', 'ปรับปรุง', 'แนะนำ', 'เสนอ', 'ปัญหา', 'ช้า', 'ไม่สะดวก'];
const STOP_WORDS = new Set([
  'การ', 'ความ', 'และ', 'ที่', 'ของ', 'ใน', 'ให้', 'มี', 'เป็น', 'ได้', 'มาก', 'ดี', 'ครับ', 'ค่ะ', 'คะ',
  'ควร', 'อยาก', 'เพิ่ม', 'ลด', 'ปรับปรุง', 'แนะนำ', 'เสนอ', 'เรื่อง', 'ส่วน', 'เพื่อ', 'จาก', 'กับ', 'ก็',
]);

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

function containsAny(value, keywords) {
  const normalized = text(value).toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function segmentWords(value) {
  const raw = text(value);
  if (!raw) return [];
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
    return Array.from(segmenter.segment(raw))
      .filter((item) => item.isWordLike)
      .map((item) => item.segment.trim().toLowerCase())
      .filter(Boolean);
  }
  return raw.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
}

function satisfactionLevel(percent) {
  if (percent >= 90) return 'ดีเยี่ยม';
  if (percent >= 80) return 'ดีมาก';
  if (percent >= 70) return 'ดี';
  if (percent >= 60) return 'ปานกลาง';
  if (percent > 0) return 'ควรปรับปรุง';
  return 'รอข้อมูล';
}

export function summarizeQuestionDistribution(rows = [], schema) {
  return schema.questionIndexes.map((columnIndex, position) => {
    const scores = rows
      .map((row) => normalizeDynamicScore(row[columnIndex]))
      .filter((score) => score !== null);
    const total = scores.length;
    const counts = [1, 2, 3, 4, 5].map((score) => ({
      score,
      count: scores.filter((value) => Math.round(value) === score).length,
    }));
    let allocated = 0;
    return {
      index: position,
      columnIndex,
      label: schema.questionLabels[position],
      total,
      scores: counts.map((item, index) => {
        const percent = total
          ? index === counts.length - 1
            ? Number((100 - allocated).toFixed(1))
            : Number(((item.count / total) * 100).toFixed(1))
          : 0;
        allocated += percent;
        return { ...item, percent };
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

export function summarizeComments(rows = [], schema) {
  const comments = [];
  rows.forEach((row, rowIndex) => {
    schema.commentIndexes.forEach((columnIndex) => {
      const value = text(row[columnIndex]);
      if (!value) return;
      const intent = containsAny(value, SUGGESTION_KEYWORDS)
        ? 'suggestion'
        : containsAny(value, POSITIVE_KEYWORDS)
          ? 'positive'
          : 'general';
      comments.push({
        text: value,
        intent,
        timestamp: text(row[schema.timestampIndex]),
        organization: text(row[schema.organizationIndex]) || 'ไม่ระบุหน่วยงาน',
        rowIndex,
        columnIndex,
      });
    });
  });

  const frequency = new Map();
  comments.forEach((comment) => {
    segmentWords(comment.text).forEach((term) => {
      if (term.length < 2 || STOP_WORDS.has(term) || /^\d+$/.test(term)) return;
      frequency.set(term, (frequency.get(term) || 0) + 1);
    });
  });

  const topTerms = Array.from(frequency.entries())
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term, 'th'))
    .slice(0, 8);

  return {
    total: comments.length,
    positiveCount: comments.filter((item) => item.intent === 'positive').length,
    suggestionCount: comments.filter((item) => item.intent === 'suggestion').length,
    generalCount: comments.filter((item) => item.intent === 'general').length,
    topTerms,
    recent: comments.slice().reverse().slice(0, 8),
  };
}

export function buildExecutiveInsight(summary, comments) {
  if (!summary?.respondents) {
    return {
      headline: 'ยังไม่มีข้อมูลเพียงพอสำหรับสรุปภาพรวม',
      detail: 'เมื่อมีผู้ตอบแบบประเมิน ระบบจะสรุปจุดเด่นและประเด็นที่ควรติดตามให้อัตโนมัติ',
      commentNote: comments?.total ? `มีข้อคิดเห็นแล้ว ${comments.total} รายการ` : 'ยังไม่มีข้อคิดเห็นเพิ่มเติม',
    };
  }

  const headline = `ภาพรวมความพึงพอใจ ${Number(summary.satisfactionPercent || 0).toFixed(1)}% อยู่ในระดับ${satisfactionLevel(Number(summary.satisfactionPercent || 0))}`;
  let detail = 'ระบบยังไม่พบคะแนนรายประเด็นที่เพียงพอสำหรับเปรียบเทียบ';
  if (summary.best && summary.worst) {
    if (summary.best.label === summary.worst.label) {
      detail = `ประเด็น “${summary.best.label}” มีคะแนนเฉลี่ย ${Number(summary.best.average).toFixed(2)} / 5`;
    } else {
      detail = `ประเด็นคะแนนสูงสุดคือ “${summary.best.label}” ${Number(summary.best.average).toFixed(2)} / 5 ส่วนประเด็นที่ควรติดตามคือ “${summary.worst.label}” ${Number(summary.worst.average).toFixed(2)} / 5`;
    }
  }
  const commentNote = comments?.total
    ? `มีข้อคิดเห็น ${comments.total} รายการ โดยพบข้อความเชิงข้อเสนอแนะ ${comments.suggestionCount || 0} รายการ`
    : 'ยังไม่มีข้อคิดเห็นเพิ่มเติม';

  return { headline, detail, commentNote };
}
