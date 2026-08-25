export const QUESTION_LABELS = [
  'เนื้อหาสอดคล้องกับวัตถุประสงค์',
  'เนื้อหาสอดคล้องกับภาระหน้าที่',
  'ประโยชน์ที่ได้รับจากการประชุม',
  'สถานที่และสภาพแวดล้อม',
  'อาหารและเครื่องดื่ม',
  'การให้บริการตามระยะเวลา',
  'ความพึงพอใจบริการโดยภาพรวม',
];

const thaiScores = [
  ['น้อยที่สุด', 1],
  ['น้อยมาก', 1],
  ['น้อย', 2],
  ['ปานกลาง', 3],
  ['มากที่สุด', 5],
  ['มาก', 4],
];

export function normalizeScore(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= 1 && value <= 5 ? value : null;
  }
  const text = String(value ?? '').trim();
  if (!text) return null;
  const numeric = text.match(/(?:^|\s)([1-5])(?:\s|$)/) || text.match(/^([1-5])(?:\.|\)|\s)/);
  if (numeric) return Number(numeric[1]);
  for (const [label, score] of thaiScores) {
    if (text.includes(label)) return score;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed >= 1 && parsed <= 5 ? parsed : null;
}

export function summarizeResponses(rows) {
  const cleanRows = (rows || []).filter((row) => Array.isArray(row) && row.some((cell) => String(cell ?? '').trim() !== ''));
  const questionScores = QUESTION_LABELS.map((_, index) =>
    cleanRows.map((row) => normalizeScore(row[index + 2])).filter((score) => score !== null)
  );
  const allScores = questionScores.flat();
  const average = allScores.length ? allScores.reduce((sum, value) => sum + value, 0) / allScores.length : 0;
  const questionAverages = questionScores.map((scores, index) => ({
    index,
    label: QUESTION_LABELS[index],
    average: scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 0,
    count: scores.length,
  }));
  const rated = questionAverages.filter((item) => item.count > 0);
  const best = rated.length ? rated.reduce((a, b) => (b.average > a.average ? b : a)) : null;
  const worst = rated.length ? rated.reduce((a, b) => (b.average < a.average ? b : a)) : null;
  const distribution = [1, 2, 3, 4, 5].map((score) => ({
    score,
    count: allScores.filter((value) => Math.round(value) === score).length,
  }));
  const positiveCount = allScores.filter((value) => value >= 4).length;
  return {
    respondents: cleanRows.length,
    average: Number(average.toFixed(2)),
    satisfactionPercent: Number(((average / 5) * 100).toFixed(2)),
    positiveRate: Number((allScores.length ? (positiveCount / allScores.length) * 100 : 0).toFixed(2)),
    questionAverages,
    distribution,
    best,
    worst,
  };
}
