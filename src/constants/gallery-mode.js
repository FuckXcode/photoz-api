const GALLERY_MODE_NOTES = {
  selection: '请勾选喜欢的照片并提交。提交后记得通知摄影师查看结果。',
  browse: '这个相册仅供浏览，可点开照片查看大图。',
};

function isGalleryMode(value) {
  return value === 'selection' || value === 'browse';
}

function normalizeGalleryMode(value) {
  return isGalleryMode(value) ? value : 'selection';
}

function getGalleryModeNote(mode) {
  return GALLERY_MODE_NOTES[mode] ?? GALLERY_MODE_NOTES.selection;
}

function canSubmitGallerySelection(mode) {
  return mode === 'selection';
}

function hasUnreadSelection(latestSelectionAt, lastViewedSelectionAt) {
  if (!latestSelectionAt) return false;
  if (!lastViewedSelectionAt) return true;
  return new Date(lastViewedSelectionAt).getTime() < new Date(latestSelectionAt).getTime();
}

module.exports = {
  isGalleryMode,
  normalizeGalleryMode,
  getGalleryModeNote,
  canSubmitGallerySelection,
  hasUnreadSelection,
};
