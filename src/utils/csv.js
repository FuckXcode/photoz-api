function csvEscape(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function createCsvAttachmentHeader(name) {
  const asciiName = name
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const fallbackName = `${asciiName || 'selection'}.csv`;
  const encodedName = encodeURIComponent(`${name}.csv`);
  return `attachment; filename="${fallbackName}"; filename*=UTF-8''${encodedName}`;
}

module.exports = { csvEscape, createCsvAttachmentHeader };
