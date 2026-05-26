const { getPublicGallery, submitSelection, getPhotographerNotificationEmail } = require('../service/repository.service');
const { sendSelectionNotificationEmail } = require('../utils/mailer');
const { success, fail } = require('../utils/response');
const ErrorCode = require('../constants/error-codes');

class ShareController {
  async getPublicGallery(ctx) {
    const { token } = ctx.params;
    const gallery = await getPublicGallery(token);
    if (!gallery) {
      ctx.body = fail(ErrorCode.NOT_FOUND, '相册不存在或链接已失效');
      return;
    }
    ctx.body = success(gallery);
  }

  async submitSelection(ctx) {
    const { token } = ctx.params;
    const body = ctx.request.body;

    try {
      const result = await submitSelection(token, {
        selectedPhotoIds: body.selectedPhotoIds ?? [],
        customerName: body.customerName,
        customerMessage: body.customerMessage,
      });

      if (!result) {
        ctx.body = fail(ErrorCode.NOT_FOUND, '相册不存在或链接已失效');
        return;
      }

      try {
        const recipientEmail = await getPhotographerNotificationEmail(result.notification.photographerId);
        await sendSelectionNotificationEmail({
          recipientEmail,
          senderName: result.notification.customerName,
          galleryId: result.notification.galleryId,
          galleryTitle: result.notification.galleryTitle,
          customerName: result.notification.customerName,
          customerMessage: result.notification.customerMessage,
          selectedCount: result.notification.selectedCount,
          submittedAt: result.notification.submittedAt,
        });
      } catch (mailError) {
        console.error('[mail] 客户提交后邮件提醒失败', mailError);
      }

      ctx.body = success(result.selection);
    } catch (err) {
      ctx.body = fail(err.errorCode || ErrorCode.INVALID_PARAMS, err.message || '提交失败');
    }
  }
}

module.exports = new ShareController();
