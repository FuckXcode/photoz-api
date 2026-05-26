const { test } = require('node:test');
const assert = require('node:assert/strict');

const { isGalleryMode, normalizeGalleryMode, canSubmitGallerySelection, hasUnreadSelection, getGalleryModeNote } = require('../../src/constants/gallery-mode');

test('isGalleryMode 接受合法值', () => {
  assert.equal(isGalleryMode('selection'), true);
  assert.equal(isGalleryMode('browse'), true);
});

test('isGalleryMode 拒绝非法值', () => {
  assert.equal(isGalleryMode('other'), false);
  assert.equal(isGalleryMode(null), false);
  assert.equal(isGalleryMode(undefined), false);
});

test('normalizeGalleryMode 非法值 fallback 到 selection', () => {
  assert.equal(normalizeGalleryMode('unknown'), 'selection');
  assert.equal(normalizeGalleryMode(undefined), 'selection');
  assert.equal(normalizeGalleryMode('selection'), 'selection');
  assert.equal(normalizeGalleryMode('browse'), 'browse');
});

test('canSubmitGallerySelection selection 模式允许提交，browse 不允许', () => {
  assert.equal(canSubmitGallerySelection('selection'), true);
  assert.equal(canSubmitGallerySelection('browse'), false);
});

test('hasUnreadSelection 无 latestSelectionAt 返回 false', () => {
  assert.equal(hasUnreadSelection(null, null), false);
  assert.equal(hasUnreadSelection(undefined, '2024-01-01'), false);
});

test('hasUnreadSelection 有 latestSelectionAt 但无 lastViewedSelectionAt 返回 true', () => {
  assert.equal(hasUnreadSelection('2024-06-01T00:00:00Z', null), true);
});

test('hasUnreadSelection 根据时间比较判断是否未读', () => {
  assert.equal(hasUnreadSelection('2024-06-02T00:00:00Z', '2024-06-01T00:00:00Z'), true);
  assert.equal(hasUnreadSelection('2024-06-01T00:00:00Z', '2024-06-02T00:00:00Z'), false);
});

test('getGalleryModeNote 返回对应模式说明文案', () => {
  assert.ok(getGalleryModeNote('selection').length > 0);
  assert.ok(getGalleryModeNote('browse').length > 0);
});
