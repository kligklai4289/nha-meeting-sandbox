import test from 'node:test';
import assert from 'node:assert/strict';
import {
  summarizeQuestionDistribution,
  summarizeByOrganization,
  summarizeByDate,
  summarizeComments,
  buildExecutiveInsight,
} from './chart-analytics.mjs';

const schema = {
  timestampIndex: 0,
  organizationIndex: 1,
  questionIndexes: [2, 3],
  questionLabels: ['เนื้อหา', 'สถานที่'],
  commentIndexes: [4, 5],
};
const rows = [
  ['2026-08-26 09:00', 'A', '5', '4', 'ดีมาก ประทับใจ', ''],
  ['2026-08-26 10:00', 'A', '4', '4', 'ควรเพิ่มเวลาอภิปราย', 'อาหารดี'],
  ['2026-08-27 09:00', 'B', '3', '5', '', 'อยากปรับปรุงระบบเสียง'],
];

test('question distribution returns counts for each score', () => {
  const data = summarizeQuestionDistribution(rows, schema);
  assert.equal(data.length, 2);
  assert.equal(data[0].scores.find((x) => x.score === 5).count, 1);
  assert.equal(data[0].total, 3);
});

test('question distribution percentages total 100 percent', () => {
  const data = summarizeQuestionDistribution(rows, schema);
  const total = data[0].scores.reduce((sum, item) => sum + item.percent, 0);
  assert.equal(total, 100);
});

test('stacked rounding never assigns percent to an empty score bucket', () => {
  const unevenRows = [
    ['2026-08-26 09:00', 'A', '1', '4', '', ''],
    ['2026-08-26 10:00', 'A', '2', '4', '', ''],
    ['2026-08-26 11:00', 'A', '3', '4', '', ''],
  ];
  const data = summarizeQuestionDistribution(unevenRows, schema)[0];
  assert.equal(data.scores.find((item) => item.score === 5).percent, 0);
  assert.equal(data.scores.find((item) => item.score === 4).percent, 0);
  assert.equal(data.scores.reduce((sum, item) => sum + item.percent, 0), 100);
});

test('organization summaries compare satisfaction averages', () => {
  const data = summarizeByOrganization(rows, schema);
  assert.equal(data.length, 2);
  assert.equal(data[0].organization, 'A');
  assert.equal(data[0].respondents, 2);
  assert.equal(data[0].average, 4.25);
});

test('date summaries are chronological', () => {
  const data = summarizeByDate(rows, schema);
  assert.deepEqual(data.map((x) => x.dateKey), ['2026-08-26', '2026-08-27']);
  assert.equal(data[0].respondents, 2);
});

test('comment summary gathers dynamic comment columns and classifies basic intent', () => {
  const result = summarizeComments(rows, schema);
  assert.equal(result.total, 4);
  assert.equal(result.positiveCount, 2);
  assert.equal(result.suggestionCount, 2);
  assert.equal(result.generalCount, 0);
  assert.equal(result.recent.length, 4);
  assert.ok(result.topTerms.some((item) => item.term.includes('อาหาร')));
});

test('executive insight describes satisfaction and best/worst questions', () => {
  const summary = {
    respondents: 3,
    satisfactionPercent: 83.3,
    positiveRate: 66.7,
    best: { label: 'สถานที่', average: 4.8 },
    worst: { label: 'เนื้อหา', average: 3.9 },
  };
  const comments = { total: 4, suggestionCount: 2 };
  const insight = buildExecutiveInsight(summary, comments);
  assert.match(insight.headline, /83\.3%/);
  assert.match(insight.detail, /สถานที่/);
  assert.match(insight.detail, /เนื้อหา/);
  assert.match(insight.commentNote, /2/);
});


test('live satisfaction wording updates question mix, organization percentages, and date trend', () => {
  const liveRows = [
    ['2026-08-27 09:00', 'A', 'พึงพอใจ', 'พึงพอใจอย่างมาก', '', ''],
    ['2026-08-27 10:00', 'B', 'ไม่แน่ใจ/เฉยๆ', 'พึงพอใจ', '', ''],
    ['2026-08-28 09:00', 'A', 'พึงพอใจอย่างมาก', 'พึงพอใจอย่างมาก', '', ''],
  ];
  const mix = summarizeQuestionDistribution(liveRows, schema);
  assert.equal(mix[0].total, 3);
  assert.equal(mix[0].scores.find((item) => item.score === 5).count, 1);
  assert.equal(mix[0].scores.find((item) => item.score === 4).count, 1);
  assert.equal(mix[0].scores.find((item) => item.score === 3).count, 1);

  const orgs = summarizeByOrganization(liveRows, schema);
  const orgA = orgs.find((item) => item.organization === 'A');
  const orgB = orgs.find((item) => item.organization === 'B');
  assert.equal(orgA.satisfactionPercent, 95);
  assert.equal(orgB.satisfactionPercent, 70);

  const dates = summarizeByDate(liveRows, schema);
  assert.deepEqual(dates.map((item) => item.dateKey), ['2026-08-27', '2026-08-28']);
  assert.equal(dates[0].satisfactionPercent, 80);
  assert.equal(dates[1].satisfactionPercent, 100);
});
