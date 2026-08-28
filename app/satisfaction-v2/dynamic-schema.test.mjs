import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSchema, normalizeDynamicScore, summarizeDynamic } from './dynamic-schema.mjs';

test('detects timestamp, organization, score questions, and comments from headers', () => {
  const headers = [
    'Timestamp',
    'หน่วยงานที่สังกัด',
    'เนื้อหาตรงตามวัตถุประสงค์',
    'วิทยากรอธิบายชัดเจน',
    'สถานที่เหมาะสม',
    'ข้อเสนอแนะเพื่อพัฒนา',
    'ข้อคิดเห็นอื่นๆ',
  ];
  const rows = [
    ['26/08/2026 10:00:00', 'รพ.สระบุรี', '5', '4', '5', 'ดีมาก', ''],
  ];
  const schema = detectSchema(headers, rows);
  assert.equal(schema.timestampIndex, 0);
  assert.equal(schema.organizationIndex, 1);
  assert.deepEqual(schema.questionIndexes, [2, 3, 4]);
  assert.deepEqual(schema.commentIndexes, [5, 6]);
  assert.deepEqual(schema.questionLabels, [
    'เนื้อหาตรงตามวัตถุประสงค์',
    'วิทยากรอธิบายชัดเจน',
    'สถานที่เหมาะสม',
  ]);
});

test('supports empty sheets by treating non-meta headers as questions', () => {
  const headers = ['ประทับเวลา', 'หน่วยงาน', 'ระบบเสียง', 'อาหารและเครื่องดื่ม', 'ข้อเสนอแนะ'];
  const schema = detectSchema(headers, []);
  assert.deepEqual(schema.questionIndexes, [2, 3]);
  assert.deepEqual(schema.commentIndexes, [4]);
});

test('summarizes any number of detected score columns', () => {
  const headers = ['Timestamp', 'หน่วยงาน', 'Q1', 'Q2', 'Q3', 'คำแนะนำ'];
  const rows = [
    ['2026-08-26', 'A', '5', '4', '3', 'x'],
    ['2026-08-26', 'B', '4', '4', '5', 'y'],
  ];
  const schema = detectSchema(headers, rows);
  const summary = summarizeDynamic(rows, schema);
  assert.equal(summary.respondents, 2);
  assert.equal(summary.questionAverages.length, 3);
  assert.equal(summary.average, 4.17);
  assert.equal(summary.satisfactionPercent, 83.33);
  assert.equal(summary.positiveRate, 83.33);
});

test('exposes a role for every field so each column can be processed', () => {
  const headers = ['Timestamp', 'หน่วยงานที่สังกัด', 'Q1', 'Q2', 'ข้อเสนอแนะ', 'ข้อคิดเห็นอื่นๆ'];
  const rows = [['2026-08-26', 'A', '5', '4', 'ดี', '']];
  const schema = detectSchema(headers, rows);
  assert.deepEqual(schema.fieldDefinitions.map((field) => field.role), [
    'time', 'organization', 'score', 'score', 'comment', 'comment',
  ]);
});

test('summarizes score, organization, time, and comment fields independently', () => {
  const headers = ['Timestamp', 'หน่วยงานที่สังกัด', 'Q1', 'Q2', 'ข้อเสนอแนะ'];
  const rows = [
    ['2026-08-26 09:00', 'A', '5', '4', 'ดีมาก'],
    ['2026-08-26 10:00', 'A', '4', '3', ''],
    ['2026-08-27 09:00', 'B', '3', '5', 'ปรับอาหาร'],
  ];
  const schema = detectSchema(headers, rows);
  const summary = summarizeDynamic(rows, schema);
  const org = summary.fieldSummaries.find((field) => field.role === 'organization');
  const q1 = summary.fieldSummaries.find((field) => field.label === 'Q1');
  const comment = summary.fieldSummaries.find((field) => field.role === 'comment');
  assert.deepEqual(org.values.slice(0, 2), [
    { value: 'A', count: 2, percent: 66.67 },
    { value: 'B', count: 1, percent: 33.33 },
  ]);
  assert.equal(q1.average, 4);
  assert.equal(q1.satisfactionPercent, 80);
  assert.equal(q1.positiveRate, 66.67);
  assert.equal(comment.responses, 2);
  assert.equal(comment.responseRate, 66.67);
});


test('maps satisfaction wording used by the live Google Form to the 5-point scale', () => {
  assert.equal(normalizeDynamicScore('พึงพอใจอย่างมาก'), 5);
  assert.equal(normalizeDynamicScore('พึงพอใจ'), 4);
  assert.equal(normalizeDynamicScore('ไม่แน่ใจ/เฉยๆ'), 3);
  assert.equal(normalizeDynamicScore('ไม่พึงพอใจ'), 2);
  assert.equal(normalizeDynamicScore('ไม่พึงพอใจอย่างมาก'), 1);
});

test('detects live satisfaction labels as score questions and drives KPIs', () => {
  const headers = ['Timestamp', 'หน่วยงานที่สังกัด', 'Q1', 'Q2', 'ข้อเสนอแนะ'];
  const rows = [
    ['8/27/2026 12:00', 'A', 'พึงพอใจ', 'พึงพอใจอย่างมาก', ''],
    ['8/27/2026 13:00', 'B', 'ไม่แน่ใจ/เฉยๆ', 'ไม่พึงพอใจ', 'x'],
  ];
  const schema = detectSchema(headers, rows);
  assert.deepEqual(schema.questionIndexes, [2, 3]);
  const summary = summarizeDynamic(rows, schema);
  assert.equal(summary.average, 3.5);
  assert.equal(summary.satisfactionPercent, 70);
  assert.equal(summary.positiveRate, 50);
  assert.equal(summary.best.label, 'Q2');
  assert.equal(summary.worst.label, 'Q1');
});
