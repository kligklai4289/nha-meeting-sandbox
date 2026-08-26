import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeQuestionDistribution, summarizeByOrganization, summarizeByDate } from './chart-analytics.mjs';

const schema = { timestampIndex: 0, organizationIndex: 1, questionIndexes: [2, 3], questionLabels: ['เนื้อหา', 'สถานที่'], commentIndexes: [] };
const rows = [
  ['2026-08-26 09:00', 'A', '5', '4'],
  ['2026-08-26 10:00', 'A', '4', '4'],
  ['2026-08-27 09:00', 'B', '3', '5'],
];

test('question distribution returns counts for each score', () => {
  const data = summarizeQuestionDistribution(rows, schema);
  assert.equal(data.length, 2);
  assert.equal(data[0].scores.find((x) => x.score === 5).count, 1);
  assert.equal(data[0].total, 3);
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
