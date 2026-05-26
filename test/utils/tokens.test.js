const { test } = require('node:test');
const assert = require('node:assert/strict');

// tokens.js 依赖 config 中的 SUPABASE_SERVICE_ROLE_KEY，测试前设置固定值
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-secret-for-unit-tests';

const { createShareToken, parseShareToken, slugify } = require('../../src/utils/tokens');

test('createShareToken 生成的 token 可被 parseShareToken 解析', () => {
  const galleryId = '550e8400-e29b-41d4-a716-446655440000';
  const token = createShareToken(galleryId);
  assert.equal(typeof token, 'string');
  assert.ok(token.includes('.'));
  const parsed = parseShareToken(token);
  assert.equal(parsed, galleryId);
});

test('parseShareToken 对篡改的 token 返回 null', () => {
  const galleryId = '550e8400-e29b-41d4-a716-446655440000';
  const token = createShareToken(galleryId);
  const tampered = token.slice(0, -3) + 'xxx';
  assert.equal(parseShareToken(tampered), null);
});

test('parseShareToken 对不含点的字符串返回 null', () => {
  assert.equal(parseShareToken('nodothere'), null);
});

test('slugify 将中英文混合标题转换为合法 slug', () => {
  const result = slugify('My Gallery 2024！测试');
  assert.match(result, /^[a-z0-9\u4e00-\u9fa5-]+$/);
  assert.ok(!result.startsWith('-'));
  assert.ok(!result.endsWith('-'));
});

test('slugify 截断超长输入至 60 字符', () => {
  const long = 'a'.repeat(100);
  assert.ok(slugify(long).length <= 60);
});
