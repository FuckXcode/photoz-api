const pool = require('../app/database');
const { buildPublicObjectUrl } = require('../utils/public-url');
const { createShareToken } = require('../utils/tokens');
const { normalizeGalleryMode, hasUnreadSelection } = require('../constants/gallery-mode');
const { R2_PUBLIC_BASE_URL } = require('../app/config');

function mapClient(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGallery(row) {
  const status = row.status;
  return {
    id: row.id,
    clientId: row.client_id,
    title: row.title,
    slug: row.slug,
    shareToken: status === 'draft' || status === 'archived' ? null : createShareToken(row.id),
    status,
    mode: normalizeGalleryMode(row.mode),
    selectionLimit: row.selection_limit,
    expiresAt: row.expires_at,
    submittedAt: row.submitted_at,
    latestSelectionAt: row.latest_selection_at,
    lastViewedSelectionAt: row.last_viewed_selection_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPhoto(row) {
  return {
    id: row.id,
    galleryId: row.gallery_id,
    originalFileName: row.original_file_name,
    title: row.title,
    originalObjectKey: row.original_object_key,
    originalUrl: buildPublicObjectUrl(R2_PUBLIC_BASE_URL, row.original_object_key ?? '', row.original_url ?? ''),
    originalSizeBytes: row.original_size_bytes,
    originalWidth: row.original_width,
    originalHeight: row.original_height,
    previewObjectKey: row.preview_object_key,
    previewUrl: buildPublicObjectUrl(R2_PUBLIC_BASE_URL, row.preview_object_key, row.preview_url),
    previewSizeBytes: row.preview_size_bytes,
    width: row.width,
    height: row.height,
    sortIndex: row.sort_index,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPublicPhoto(row) {
  return {
    id: row.id,
    originalFileName: row.original_file_name,
    title: row.title,
    originalUrl: buildPublicObjectUrl(R2_PUBLIC_BASE_URL, row.original_object_key ?? '', row.original_url ?? ''),
    originalSizeBytes: row.original_size_bytes,
    originalWidth: row.original_width,
    originalHeight: row.original_height,
    previewUrl: buildPublicObjectUrl(R2_PUBLIC_BASE_URL, row.preview_object_key, row.preview_url),
    previewSizeBytes: row.preview_size_bytes,
    width: row.width,
    height: row.height,
  };
}

function mapSelection(row) {
  return {
    id: row.id,
    galleryId: row.gallery_id,
    selectedPhotoIds: row.selected_photo_ids,
    customerName: row.customer_name,
    customerMessage: row.customer_message,
    createdAt: row.created_at,
  };
}

async function listClients(photographerId) {
  const { rows } = await pool.query(
    `SELECT * FROM clients WHERE photographer_id = $1 ORDER BY created_at DESC`,
    [photographerId],
  );
  return rows.map(mapClient);
}

async function createClient(photographerId, input) {
  const { rows } = await pool.query(
    `INSERT INTO clients (photographer_id, name, phone, email, note)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [
      photographerId,
      input.name.trim(),
      input.phone?.trim() ?? '',
      input.email?.trim() ?? '',
      input.note?.trim() ?? '',
    ],
  );
  return mapClient(rows[0]);
}

async function deleteClient(photographerId, id) {
  const { rows: galleryRows } = await pool.query(
    `SELECT g.id FROM galleries g WHERE g.photographer_id = $1 AND g.client_id = $2`,
    [photographerId, id],
  );
  const galleryIds = galleryRows.map((r) => r.id);

  let objectKeys = [];
  if (galleryIds.length > 0) {
    const { rows: photoRows } = await pool.query(
      `SELECT preview_object_key, original_object_key FROM photos WHERE gallery_id = ANY($1::uuid[])`,
      [galleryIds],
    );
    objectKeys = photoRows.flatMap((p) =>
      [p.preview_object_key, p.original_object_key].filter(Boolean),
    );
  }

  const { rows } = await pool.query(
    `DELETE FROM clients WHERE id = $1 AND photographer_id = $2 RETURNING id`,
    [id, photographerId],
  );

  return rows.length > 0 ? objectKeys : null;
}

async function listGalleryItems(photographerId) {
  const { rows } = await pool.query(
    `SELECT
       g.*,
       c.id AS client__id,
       c.name AS client__name,
       (SELECT COUNT(*) FROM photos p WHERE p.gallery_id = g.id)::int AS photo_count
     FROM galleries g
     LEFT JOIN clients c ON g.client_id = c.id
     WHERE g.photographer_id = $1
     ORDER BY g.created_at DESC`,
    [photographerId],
  );

  return rows.map((row) => {
    const gallery = mapGallery(row);
    return {
      ...gallery,
      client: row.client__id ? { id: row.client__id, name: row.client__name } : null,
      photoCount: row.photo_count ?? 0,
      hasUnreadSelection: hasUnreadSelection(gallery.latestSelectionAt, gallery.lastViewedSelectionAt),
    };
  });
}

async function getGalleryWithRelations(photographerId, id) {
  const { rows: galleryRows } = await pool.query(
    `SELECT g.*, c.id AS client__id, c.name AS client__name, c.phone AS client__phone,
            c.email AS client__email, c.note AS client__note,
            c.created_at AS client__created_at, c.updated_at AS client__updated_at
     FROM galleries g
     LEFT JOIN clients c ON g.client_id = c.id
     WHERE g.id = $1 AND g.photographer_id = $2`,
    [id, photographerId],
  );

  if (galleryRows.length === 0) return null;
  const row = galleryRows[0];

  const [photosResult, selectionsResult] = await Promise.all([
    pool.query(`SELECT * FROM photos WHERE gallery_id = $1 ORDER BY sort_index ASC`, [id]),
    pool.query(
      `SELECT * FROM selection_events WHERE gallery_id = $1 ORDER BY created_at DESC`,
      [id],
    ),
  ]);

  const gallery = mapGallery(row);
  return {
    ...gallery,
    client: row.client__id
      ? {
          id: row.client__id,
          name: row.client__name,
          phone: row.client__phone,
          email: row.client__email,
          note: row.client__note,
          createdAt: row.client__created_at,
          updatedAt: row.client__updated_at,
        }
      : null,
    photos: photosResult.rows.map(mapPhoto),
    selections: selectionsResult.rows.map(mapSelection),
    hasUnreadSelection: hasUnreadSelection(gallery.latestSelectionAt, gallery.lastViewedSelectionAt),
  };
}

async function markGallerySelectionViewed(photographerId, id, latestSelectionAt) {
  await pool.query(
    `UPDATE galleries SET last_viewed_selection_at = $1, updated_at = NOW()
     WHERE id = $2 AND photographer_id = $3`,
    [latestSelectionAt, id, photographerId],
  );
}

async function updateGalleryMode(photographerId, id, mode) {
  const { rows } = await pool.query(
    `UPDATE galleries SET mode = $1, updated_at = NOW()
     WHERE id = $2 AND photographer_id = $3 RETURNING id`,
    [mode, id, photographerId],
  );
  if (rows.length === 0) return null;
  return getGalleryWithRelations(photographerId, id);
}

async function createGallery(photographerId, input) {
  const { rows: clientCheck } = await pool.query(
    `SELECT id FROM clients WHERE id = $1 AND photographer_id = $2`,
    [input.clientId, photographerId],
  );
  if (clientCheck.length === 0) throw Object.assign(new Error('客户不存在'), { status: 400 });

  const { randomUUID } = require('node:crypto');
  const { slugify } = require('../utils/tokens');
  const slug = slugify(input.title) || randomUUID().slice(0, 8);

  const { rows } = await pool.query(
    `INSERT INTO galleries (photographer_id, client_id, title, slug, status, mode, selection_limit, expires_at)
     VALUES ($1, $2, $3, $4, 'draft', 'selection', $5, $6)
     RETURNING id`,
    [photographerId, input.clientId, input.title.trim(), slug, input.selectionLimit ?? null, input.expiresAt ?? null],
  );

  return getGalleryWithRelations(photographerId, rows[0].id);
}

async function deleteGallery(photographerId, id) {
  const gallery = await getGalleryWithRelations(photographerId, id);
  if (!gallery) return null;

  const { rows } = await pool.query(
    `DELETE FROM galleries WHERE id = $1 AND photographer_id = $2 RETURNING id`,
    [id, photographerId],
  );

  return rows.length > 0
    ? gallery.photos.flatMap((p) => [p.previewObjectKey, p.originalObjectKey].filter(Boolean))
    : null;
}

async function publishGallery(photographerId, id) {
  const { rows } = await pool.query(
    `UPDATE galleries SET share_token_hash = NULL, status = 'published', updated_at = NOW()
     WHERE id = $1 AND photographer_id = $2 RETURNING id`,
    [id, photographerId],
  );
  if (rows.length === 0) return null;

  const gallery = await getGalleryWithRelations(photographerId, id);
  if (!gallery) return null;

  const { createShareToken } = require('../utils/tokens');
  return { ...gallery, shareToken: createShareToken(id) };
}

async function addPhotos(photographerId, galleryId, inputPhotos) {
  const gallery = await getGalleryWithRelations(photographerId, galleryId);
  if (!gallery) return null;

  const currentCount = gallery.photos.length;
  const insertedRows = [];

  for (let i = 0; i < inputPhotos.length; i++) {
    const photo = inputPhotos[i];
    const title = photo.title?.trim() || photo.originalFileName.replace(/\.[^.]+$/, '');
    const { rows } = await pool.query(
      `INSERT INTO photos
         (gallery_id, original_file_name, title, original_object_key, original_url,
          original_size_bytes, original_width, original_height,
          preview_object_key, preview_url, preview_size_bytes, width, height, sort_index)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        galleryId,
        photo.originalFileName,
        title,
        photo.originalObjectKey ?? null,
        photo.originalUrl ?? '',
        photo.originalSizeBytes ?? null,
        photo.originalWidth ?? null,
        photo.originalHeight ?? null,
        photo.previewObjectKey,
        photo.previewUrl,
        photo.previewSizeBytes ?? null,
        photo.width ?? null,
        photo.height ?? null,
        currentCount + i,
      ],
    );
    insertedRows.push(rows[0]);
  }

  return insertedRows.map(mapPhoto);
}

async function deletePhoto(photographerId, galleryId, photoId) {
  const { rows: galleryCheck } = await pool.query(
    `SELECT id FROM galleries WHERE id = $1 AND photographer_id = $2`,
    [galleryId, photographerId],
  );
  if (galleryCheck.length === 0) return null;

  const { rows } = await pool.query(
    `DELETE FROM photos WHERE id = $1 AND gallery_id = $2 RETURNING *`,
    [photoId, galleryId],
  );
  return rows.length > 0 ? mapPhoto(rows[0]) : null;
}

async function getDashboardSummary(photographerId) {
  const [clientCountResult, galleries] = await Promise.all([
    pool.query(`SELECT COUNT(*)::int AS count FROM clients WHERE photographer_id = $1`, [photographerId]),
    listGalleryItems(photographerId),
  ]);

  return {
    clientCount: clientCountResult.rows[0].count,
    galleryCount: galleries.length,
    publishedCount: galleries.filter((g) => g.status === 'published').length,
    submittedCount: galleries.filter((g) => g.status === 'submitted').length,
    unreadSubmissionCount: galleries.filter((g) => g.hasUnreadSelection).length,
    photoCount: galleries.reduce((sum, g) => sum + g.photoCount, 0),
    latestGalleries: galleries.slice(0, 5),
  };
}

async function getPhotographerNotificationEmail(photographerId) {
  const { getSupabaseAdmin } = require('../utils/supabase-auth');
  const { data: userData, error: userError } = await getSupabaseAdmin().auth.admin.getUserById(photographerId);
  if (!userError && userData.user?.email) return userData.user.email;

  const { rows } = await pool.query(
    `SELECT email FROM photographer_profiles WHERE user_id = $1`,
    [photographerId],
  );
  return rows[0]?.email || '';
}

async function getPublicGallery(token) {
  const { parseShareToken } = require('../utils/tokens');
  const { normalizeGalleryMode, getGalleryModeNote } = require('../constants/gallery-mode');

  const galleryId = parseShareToken(token);
  if (!galleryId) return null;

  const { rows } = await pool.query(
    `SELECT g.id, g.title, g.slug, g.status, g.mode, g.selection_limit, g.expires_at,
            g.submitted_at, g.created_at, g.updated_at, c.name AS client_name
     FROM galleries g
     LEFT JOIN clients c ON g.client_id = c.id
     WHERE g.id = $1`,
    [galleryId],
  );

  if (rows.length === 0) return null;
  const gallery = rows[0];

  if (gallery.status === 'draft' || gallery.status === 'archived') return null;

  const { rows: photos } = await pool.query(
    `SELECT * FROM photos WHERE gallery_id = $1 ORDER BY sort_index ASC`,
    [galleryId],
  );

  const mode = normalizeGalleryMode(gallery.mode);
  return {
    token,
    title: gallery.title,
    clientName: gallery.client_name ?? '客户',
    photographerName: 'PhotoZ',
    shootDate: gallery.created_at.toISOString?.()?.slice(0, 10) ?? String(gallery.created_at).slice(0, 10),
    selectionLimit: gallery.selection_limit,
    expiresAt: gallery.expires_at,
    status: gallery.status,
    mode,
    note: getGalleryModeNote(mode),
    photos: photos.map(mapPublicPhoto),
  };
}

async function submitSelection(token, input) {
  const { parseShareToken } = require('../utils/tokens');
  const { canSubmitGallerySelection, normalizeGalleryMode } = require('../constants/gallery-mode');

  const galleryId = parseShareToken(token);
  if (!galleryId) return null;

  const { rows: galleryRows } = await pool.query(
    `SELECT g.*, c.name AS client_name
     FROM galleries g
     LEFT JOIN clients c ON g.client_id = c.id
     WHERE g.id = $1`,
    [galleryId],
  );
  if (galleryRows.length === 0) return null;
  const gallery = galleryRows[0];

  if (!canSubmitGallerySelection(normalizeGalleryMode(gallery.mode))) {
    throw Object.assign(new Error('该相册仅供浏览，不能提交选片'), { status: 400 });
  }

  const { rows: photoRows } = await pool.query(
    `SELECT id FROM photos WHERE gallery_id = $1`,
    [galleryId],
  );
  const validPhotoIds = new Set(photoRows.map((p) => p.id));
  const selectedPhotoIds = (input.selectedPhotoIds ?? []).filter((id) => validPhotoIds.has(id));

  if (selectedPhotoIds.length === 0) {
    throw Object.assign(new Error('至少选择一张照片'), { status: 400 });
  }

  if (typeof gallery.selection_limit === 'number' && selectedPhotoIds.length > gallery.selection_limit) {
    throw Object.assign(new Error(`最多只能选择 ${gallery.selection_limit} 张照片`), { status: 400 });
  }

  const { rows: selectionRows } = await pool.query(
    `INSERT INTO selection_events (gallery_id, selected_photo_ids, customer_name, customer_message)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      galleryId,
      selectedPhotoIds,
      input.customerName?.trim() ?? '',
      input.customerMessage?.trim() ?? '',
    ],
  );

  const selection = selectionRows[0];
  const submittedAt = selection.created_at;

  await pool.query(
    `UPDATE galleries SET status = 'submitted', submitted_at = $1, latest_selection_at = $1, updated_at = $1
     WHERE id = $2`,
    [submittedAt, galleryId],
  );

  return {
    selection: mapSelection(selection),
    notification: {
      galleryId,
      galleryTitle: gallery.title,
      photographerId: gallery.photographer_id,
      customerName: input.customerName?.trim() ?? gallery.client_name ?? '',
      customerMessage: input.customerMessage?.trim() ?? '',
      selectedCount: selectedPhotoIds.length,
      submittedAt: submittedAt instanceof Date ? submittedAt.toISOString() : String(submittedAt),
    },
  };
}

module.exports = {
  listClients,
  createClient,
  deleteClient,
  listGalleryItems,
  getGalleryWithRelations,
  markGallerySelectionViewed,
  updateGalleryMode,
  createGallery,
  deleteGallery,
  publishGallery,
  addPhotos,
  deletePhoto,
  getDashboardSummary,
  getPhotographerNotificationEmail,
  getPublicGallery,
  submitSelection,
};
