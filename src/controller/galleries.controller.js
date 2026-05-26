const {
  listGalleryItems,
  getGalleryWithRelations,
  createGallery,
  deleteGallery,
  updateGalleryMode,
  publishGallery,
  addPhotos,
  deletePhoto,
  markGallerySelectionViewed,
} = require('../service/repository.service');
const { deleteStorageObject, createPhotoUploadUrl } = require('../utils/storage');
const { isGalleryMode } = require('../constants/gallery-mode');
const { csvEscape, createCsvAttachmentHeader } = require('../utils/csv');
const { success, fail } = require('../utils/response');
const ErrorCode = require('../constants/error-codes');

function normalizeUploadedPhotos(photos) {
  return (photos ?? []).filter(
    (p) => p.originalFileName && p.previewObjectKey && p.previewUrl,
  );
}

class GalleriesController {
  async list(ctx) {
    ctx.body = await listGalleryItems(ctx.user.id);
  }

  async create(ctx) {
    const body = ctx.request.body;
    if (!body.clientId) {
      ctx.status = 400;
      ctx.body = { error: '请选择客户' };
      return;
    }
    if (!body.title?.trim()) {
      ctx.status = 400;
      ctx.body = { error: '相册标题不能为空' };
      return;
    }
    try {
      ctx.body = await createGallery(ctx.user.id, {
        clientId: body.clientId,
        title: body.title,
        selectionLimit: body.selectionLimit ?? null,
        expiresAt: body.expiresAt ?? null,
      });
    } catch (err) {
      ctx.status = err.status || 400;
      ctx.body = { error: err.message || '创建相册失败' };
    }
  }

  async detail(ctx) {
    const { id } = ctx.params;
    const gallery = await getGalleryWithRelations(ctx.user.id, id);
    if (!gallery) {
      ctx.status = 404;
      ctx.body = { error: '相册不存在' };
      return;
    }
    if (gallery.hasUnreadSelection && gallery.latestSelectionAt) {
      await markGallerySelectionViewed(ctx.user.id, gallery.id, gallery.latestSelectionAt);
      gallery.hasUnreadSelection = false;
      gallery.lastViewedSelectionAt = gallery.latestSelectionAt;
    }
    ctx.body = gallery;
  }

  async remove(ctx) {
    const { id } = ctx.params;
    const objectKeys = await deleteGallery(ctx.user.id, id);
    if (objectKeys === null) {
      ctx.status = 404;
      ctx.body = { error: '相册不存在' };
      return;
    }
    await Promise.allSettled(objectKeys.map((key) => deleteStorageObject(key)));
    ctx.body = { ok: true };
  }

  async updateMode(ctx) {
    const { id } = ctx.params;
    const { mode } = ctx.request.body;
    if (!isGalleryMode(mode)) {
      ctx.status = 400;
      ctx.body = { error: '相册模式不正确' };
      return;
    }
    const gallery = await updateGalleryMode(ctx.user.id, id, mode);
    if (!gallery) {
      ctx.status = 404;
      ctx.body = { error: '相册不存在' };
      return;
    }
    ctx.body = gallery;
  }

  async publish(ctx) {
    const { id } = ctx.params;
    const gallery = await publishGallery(ctx.user.id, id);
    if (!gallery) {
      ctx.status = 404;
      ctx.body = { error: '相册不存在' };
      return;
    }
    ctx.body = gallery;
  }

  async getUploadUrl(ctx) {
    const { id } = ctx.params;
    const body = ctx.request.body;

    if (!body.fileName || !String(body.contentType || '').startsWith('image/')) {
      ctx.status = 400;
      ctx.body = { error: '只支持上传图片文件' };
      return;
    }
    if (body.variant !== 'preview' && body.variant !== 'original') {
      ctx.status = 400;
      ctx.body = { error: '缺少图片存储类型' };
      return;
    }

    const gallery = await getGalleryWithRelations(ctx.user.id, id);
    if (!gallery) {
      ctx.status = 404;
      ctx.body = { error: '相册不存在' };
      return;
    }

    ctx.body = await createPhotoUploadUrl({
      photographerId: ctx.user.id,
      galleryId: id,
      fileName: body.fileName,
      contentType: body.contentType,
      variant: body.variant,
    });
  }

  async addPhotos(ctx) {
    const { id } = ctx.params;
    const body = ctx.request.body;
    const photos = normalizeUploadedPhotos(body.photos);

    if (photos.length === 0) {
      ctx.status = 400;
      ctx.body = { error: '请选择照片' };
      return;
    }

    const created = await addPhotos(ctx.user.id, id, photos);
    if (!created) {
      ctx.status = 404;
      ctx.body = { error: '相册不存在' };
      return;
    }
    ctx.body = created;
  }

  async deletePhoto(ctx) {
    const { id, photoId } = ctx.params;
    const photo = await deletePhoto(ctx.user.id, id, photoId);
    if (!photo) {
      ctx.status = 404;
      ctx.body = { error: '照片不存在' };
      return;
    }
    await Promise.allSettled([
      deleteStorageObject(photo.previewObjectKey),
      deleteStorageObject(photo.originalObjectKey),
    ]);
    ctx.body = { ok: true };
  }

  async exportCsv(ctx) {
    const { id } = ctx.params;
    const gallery = await getGalleryWithRelations(ctx.user.id, id);
    if (!gallery) {
      ctx.status = 404;
      ctx.body = { error: '相册不存在' };
      return;
    }

    const latestSelection = gallery.selections[0];
    const selected = new Set(latestSelection?.selectedPhotoIds ?? []);
    const rows = [
      ['相册', '客户', '照片文件名', '照片标题', '是否已选', '提交人', '客户留言', '提交时间'],
      ...gallery.photos.map((photo) => [
        gallery.title,
        gallery.client?.name ?? '',
        photo.originalFileName,
        photo.title,
        selected.has(photo.id) ? '是' : '否',
        latestSelection?.customerName ?? '',
        latestSelection?.customerMessage ?? '',
        latestSelection?.createdAt ?? '',
      ]),
    ];

    ctx.set('content-type', 'text/csv; charset=utf-8');
    ctx.set('content-disposition', createCsvAttachmentHeader(`${gallery.slug || gallery.id}-selection`));
    ctx.body = `\uFEFF${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}`;
  }
}

module.exports = new GalleriesController();
