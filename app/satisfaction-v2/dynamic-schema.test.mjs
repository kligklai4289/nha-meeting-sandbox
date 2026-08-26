import test from 'node:test';
import assert from 'node:assert/strict';
import { detectSchema, summarizeDynamic } from './dynamic-schema.mjs';

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
  assert.equal(summary.satisfactionPercent, 83.4);
  assert.equal(summary.positiveRate, 83.33);
});
