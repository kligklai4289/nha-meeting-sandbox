const COMMENT_KEYWORDS = ['ข้อเสนอแนะ', 'ข้อคิดเห็น', 'ความคิดเห็น', 'คำแนะนำ', 'comment', 'suggestion', 'feedback'];
const ORG_KEYWORDS = ['หน่วยงาน', 'สังกัด', 'organization', 'agency', 'department'];
const TIME_KEYWORDS = ['timestamp', 'ประทับเวลา', 'เวลา', 'วันที่'];

function text(value) {
  return String(value ?? '').trim();
}

function containsAny(value, keywords) {
  const normalized = text(value).toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

function percent(part, total) {
  return Number((total ? (part / total) * 100 : 0).toFixed(2));
}

function summarizeValues(values) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count, percent: percent(count, values.length) }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'th'));
}

export function normalizeDynamicScore(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value >= 1 && value <= 5 ? value : null;
  const raw = text(value);
  if (!raw) return null;
  const numeric = raw.match(/(?:^|\s)([1-5])(?:\s|$)/) || raw.match(/^([1-5])(?:\.|\)|\s)/);
  if (numeric) return Number(numeric[1]);
  const scoreMap = [
    ['มากที่สุด', 5],
    ['มาก', 4],
    ['ปานกลาง', 3],
    ['น้อยที่สุด', 1],
    ['น้อยมาก', 1],
    ['น้อย', 2],
  ];
  for (const [label, score] of scoreMap) if (raw.includes(label)) return score;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

export function detectSchema(headers = [], rows = []) {
  const cleanHeaders = headers.map((header, index) => text(header) || `คอลัมน์ ${index + 1}`);
  const timestampIndex = cleanHeaders.findIndex((header) => containsAny(header, TIME_KEYWORDS));
  const organizationIndex = cleanHeaders.findIndex((header) => containsAny(header, ORG_KEYWORDS));
  const commentIndexes = cleanHeaders
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => containsAny(header, COMMENT_KEYWORDS))
    .map(({ index }) => index);

  const reserved = new Set([timestampIndex, organizationIndex, ...commentIndexes].filter((index) => index >= 0));
  const questionIndexes = cleanHeaders
    .map((header, index) => ({ header, index }))
    .filter(({ index }) => !reserved.has(index))
    .filter(({ index }) => {
      const populated = rows.map((row) => row[index]).filter((value) => text(value) !== '');
      if (!populated.length) return true;
      const scoreCount = populated.filter((value) => normalizeDynamicScore(value) !== null).length;
      return scoreCount / populated.length >= 0.6;
    })
    .map(({ index }) => index);

  const resolvedTimestampIndex = timestampIndex >= 0 ? timestampIndex : 0;
  const resolvedOrganizationIndex = organizationIndex >= 0 ? organizationIndex : 1;
  const questionSet = new Set(questionIndexes);
  const commentSet = new Set(commentIndexes);
  const fieldDefinitions = cleanHeaders.map((label, index) => ({
    index,
    label,
    role: index === resolvedTimestampIndex
      ? 'time'
      : index === resolvedOrganizationIndex
        ? 'organization'
        : commentSet.has(index)
          ? 'comment'
          : questionSet.has(index)
            ? 'score'
            : 'category',
  }));

  return {
    headers: cleanHeaders,
    timestampIndex: resolvedTimestampIndex,
    organizationIndex: resolvedOrganizationIndex,
    questionIndexes,
    questionLabels: questionIndexes.map((index) => cleanHeaders[index]),
    commentIndexes,
    fieldDefinitions,
  };
}

export function summarizeDynamic(rows = [], schema) {
  const cleanRows = rows.filter((row) => Array.isArray(row) && row.some((cell) => text(cell) !== ''));
  const questionScores = schema.questionIndexes.map((columnIndex) =>
    cleanRows.map((row) => normalizeDynamicScore(row[columnIndex])).filter((score) => score !== null)
  );
  const allScores = questionScores.flat();
  const average = allScores.length ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length : 0;
  const questionAverages = schema.questionIndexes.map((columnIndex, position) => {
    const scores = questionScores[position];
    return {
      index: position,
      columnIndex,
      label: schema.questionLabels[position],
      average: scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0,
      count: scores.length,
    };
  });
  const positiveCount = allScores.filter((value) => value >= 4).length;
  const distribution = [1, 2, 3, 4, 5].map((score) => ({ score, count: allScores.filter((value) => Math.round(value) === score).length }));
  const rated = questionAverages.filter((item) => item.count > 0);

  const definitions = schema.fieldDefinitions || schema.headers.map((label, index) => ({ index, label, role: 'category' }));
  const fieldSummaries = definitions.map((field) => {
    const rawValues = cleanRows.map((row) => text(row[field.index])).filter(Boolean);
    const base = {
      ...field,
      responses: rawValues.length,
      responseRate: percent(rawValues.length, cleanRows.length),
      uniqueCount: new Set(rawValues).size,
    };

    if (field.role === 'score') {
      const scores = rawValues.map((value) => normalizeDynamicScore(value)).filter((score) => score !== null);
      const fieldAverage = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0;
      const fieldPositive = scores.filter((value) => value >= 4).length;
      return {
        ...base,
        average: Number(fieldAverage.toFixed(2)),
        satisfactionPercent: Number(((fieldAverage / 5) * 100).toFixed(2)),
        positiveRate: percent(fieldPositive, scores.length),
        distribution: [1, 2, 3, 4, 5].map((score) => ({ score, count: scores.filter((value) => Math.round(value) === score).length })),
      };
    }

    if (field.role === 'organization' || field.role === 'category') {
      return { ...base, values: summarizeValues(rawValues) };
    }

    return base;
  });

  return {
    respondents: cleanRows.length,
    average: Number(average.toFixed(2)),
    satisfactionPercent: Number(((average / 5) * 100).toFixed(2)),
    positiveRate: Number((allScores.length ? (positiveCount / allScores.length) * 100 : 0).toFixed(2)),
    questionAverages,
    distribution,
    best: rated.length ? rated.reduce((a, b) => (b.average > a.average ? b : a)) : null,
    worst: rated.length ? rated.reduce((a, b) => (b.average < a.average ? b : a)) : null,
    fieldSummaries,
  };
}
