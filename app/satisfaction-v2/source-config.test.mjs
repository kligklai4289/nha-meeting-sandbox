import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_SOURCE, extractSheetId, normalizeSource, buildGvizUrl, buildShareParams } from './source-config.mjs';

test('extracts sheet id from a Google Sheets URL', () => {
  assert.equal(extractSheetId('https://docs.google.com/spreadsheets/d/abcDEF_123-xyz/edit#gid=0'), 'abcDEF_123-xyz');
});

test('accepts a raw Google Sheet id', () => {
  assert.equal(extractSheetId('abcDEF_123-xyz'), 'abcDEF_123-xyz');
});

test('normalizes missing values to the legacy-compatible defaults', () => {
  assert.deepEqual(normalizeSource({}), DEFAULT_SOURCE);
});

test('builds an encoded GViz JSONP URL', () => {
  const url = buildGvizUrl({ sheetId: 'abc', sheetName: 'Form Responses 1' }, '__cb', 123);
  assert.match(url, /docs\.google\.com\/spreadsheets\/d\/abc\/gviz\/tq/);
  assert.match(url, /sheet=Form%20Responses%201/);
  assert.match(url, /responseHandler%3A__cb/);
  assert.match(url, /_=123/);
});

test('builds share parameters that round-trip source fields', () => {
  const params = buildShareParams({ sheetId: 'abc', sheetName: 'Responses', title: 'Meeting A', subtitle: '27 Aug' });
  const parsed = new URLSearchParams(params);
  assert.equal(parsed.get('sheetId'), 'abc');
  assert.equal(parsed.get('sheetName'), 'Responses');
  assert.equal(parsed.get('title'), 'Meeting A');
  assert.equal(parsed.get('subtitle'), '27 Aug');
});
