const { test } = require('node:test');
const assert = require('node:assert/strict');

const { buildPublicObjectUrl } = require('../../src/utils/public-url');

test('buildPublicObjectUrl 拼接 baseUrl 和 objectKey', () => {
  const url = buildPublicObjectUrl('https://pub.r2.dev', 'photographers/abc/photo.jpg');
  assert.equal(url, 'https://pub.r2.dev/photographers/abc/photo.jpg');
});

test('buildPublicObjectUrl 对 objectKey 各段做 encodeURIComponent', () => {
  const url = buildPublicObjectUrl('https://pub.r2.dev', 'a/b c/d.jpg');
  assert.equal(url, 'https://pub.r2.dev/a/b%20c/d.jpg');
});

test('buildPublicObjectUrl baseUrl 末尾斜杠不产生双斜杠', () => {
  const url = buildPublicObjectUrl('https://pub.r2.dev/', 'file.jpg');
  assert.equal(url, 'https://pub.r2.dev/file.jpg');
});

test('buildPublicObjectUrl 无 baseUrl 时返回 fallbackUrl', () => {
  const url = buildPublicObjectUrl('', 'file.jpg', 'https://fallback.com/file.jpg');
  assert.equal(url, 'https://fallback.com/file.jpg');
});

test('buildPublicObjectUrl 无 objectKey 时返回 fallbackUrl', () => {
  const url = buildPublicObjectUrl('https://pub.r2.dev', '', 'fallback');
  assert.equal(url, 'fallback');
});
