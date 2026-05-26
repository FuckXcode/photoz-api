const { test } = require('node:test');
const assert = require('node:assert/strict');

const { csvEscape, createCsvAttachmentHeader } = require('../../src/utils/csv');

test('csvEscape 包裹值为双引号字符串', () => {
  assert.equal(csvEscape('hello'), '"hello"');
});

test('csvEscape 转义内部双引号', () => {
  assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
});

test('csvEscape 处理 null/undefined 为空字符串', () => {
  assert.equal(csvEscape(null), '""');
  assert.equal(csvEscape(undefined), '""');
});

test('createCsvAttachmentHeader 包含 attachment 指令', () => {
  const header = createCsvAttachmentHeader('my-gallery');
  assert.ok(header.startsWith('attachment;'));
  assert.ok(header.includes('my-gallery.csv'));
});

test('createCsvAttachmentHeader 对非 ASCII 文件名生成 UTF-8 编码', () => {
  const header = createCsvAttachmentHeader('测试相册-selection');
  assert.ok(header.includes("filename*=UTF-8''"));
});
