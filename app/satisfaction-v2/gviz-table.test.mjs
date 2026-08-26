import test from 'node:test';
import assert from 'node:assert/strict';
import { parseGvizTable } from './gviz-table.mjs';

test('promotes first row to headers when GViz returns generic columns for an empty Google Form response sheet', () => {
  const response = {
    table: {
      cols: Array.from({ length: 11 }, (_, index) => ({ id: String.fromCharCode(65 + index), label: '' })),
      rows: [{ c: [
        { v: 'Timestamp' },
        { v: 'หน่วยงานที่สังกัด' },
        { v: 'เนื้อหามีความสอดคล้องกับวัตถุประสงค์ของการประชุม' },
        { v: 'เนื้อหาสอดคล้องกับภาระหน้าที่ที่ท่านดำเนินการอยู่' },
        { v: 'ประโยชน์ที่ท่านได้รับจาการประชุมปฏิบัติการ' },
        { v: 'สถานที่และสภาพแวดล้อมมีความเหมาะสม' },
        { v: 'อาหารและเครื่องดื่มต่าง ๆ มีความเหมาะสม' },
        { v: 'การให้บริการเป็นไปตามระยะเวลาที่กำหนด' },
        { v: 'ความพึงพอใจในการบริการโดยภาพรวม' },
        { v: 'ข้อเสนอแนะนำไปพัฒนาการประชุมในโอกาสต่อไป' },
        { v: 'ข้อคิดเห็นอื่นๆ' },
      ] }],
    },
  };

  const parsed = parseGvizTable(response);
  assert.equal(parsed.rows.length, 0);
  assert.equal(parsed.headers.length, 11);
  assert.equal(parsed.headers[0], 'Timestamp');
  assert.equal(parsed.headers[9], 'ข้อเสนอแนะนำไปพัฒนาการประชุมในโอกาสต่อไป');
});

test('keeps normal GViz labels and data rows unchanged', () => {
  const response = {
    table: {
      cols: [{ id: 'A', label: 'Timestamp' }, { id: 'B', label: 'คะแนน' }],
      rows: [{ c: [{ v: '2026-08-26 09:00' }, { v: 5 }] }],
    },
  };
  const parsed = parseGvizTable(response);
  assert.deepEqual(parsed.headers, ['Timestamp', 'คะแนน']);
  assert.deepEqual(parsed.rows, [['2026-08-26 09:00', '5']]);
});
