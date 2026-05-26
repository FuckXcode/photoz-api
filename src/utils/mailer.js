const config = require('../app/config');

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getSiteUrl() {
  const raw = config.PUBLIC_SITE_URL?.trim();
  if (!raw) return 'http://localhost:3000/';
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(candidate);
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    return 'http://localhost:3000/';
  }
}

function buildSelectionNotificationEmail({ galleryId, galleryTitle, customerName, customerMessage, selectedCount, submittedAt, siteUrl }) {
  const submittedAtStr = new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })
    .format(new Date(submittedAt));
  const galleryPath = `/galleries/${galleryId}`;
  const galleryUrl = new URL(galleryPath, siteUrl).toString();
  const loginUrl = new URL(`/login?redirect=${encodeURIComponent(galleryPath)}`, siteUrl).toString();
  const displayName = customerName || '客户';
  const messageBlock = customerMessage ? `客户留言：${customerMessage}` : '客户留言：无';

  return {
    subject: `【${displayName}】已提交选片，请及时查看`,
    text: [
      `${displayName} 刚刚提交了选片结果。`,
      '',
      `相册：${galleryTitle}`,
      `选中数量：${selectedCount} 张`,
      `提交时间：${submittedAtStr}`,
      messageBlock,
      '',
      `登录后台查看：${loginUrl}`,
      `相册直达地址：${galleryUrl}`,
    ].join('\n'),
    html: [
      '<div style="font-family:Arial,PingFang SC,Microsoft YaHei,sans-serif;color:#24190f;line-height:1.7;">',
      `<p><strong>${escapeHtml(displayName)}</strong> 刚刚提交了选片结果。</p>`,
      '<div style="padding:16px 18px;border-radius:14px;background:#f7efe2;border:1px solid rgba(68,46,26,0.1);">',
      `<p style="margin:0 0 8px;"><strong>相册：</strong>${escapeHtml(galleryTitle)}</p>`,
      `<p style="margin:0 0 8px;"><strong>选中数量：</strong>${selectedCount} 张</p>`,
      `<p style="margin:0 0 8px;"><strong>提交时间：</strong>${escapeHtml(submittedAtStr)}</p>`,
      `<p style="margin:0;"><strong>客户留言：</strong>${escapeHtml(customerMessage || '无')}</p>`,
      '</div>',
      `<p style="margin:18px 0 0;"><a href="${loginUrl}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#2b1e13;color:#fff7e8;text-decoration:none;font-weight:700;">登录后台查看相册</a></p>`,
      `<p style="margin:12px 0 0;color:#6d5847;font-size:13px;">如果已登录，也可直接打开：<a href="${galleryUrl}" style="color:#2b1e13;">${galleryUrl}</a></p>`,
      '</div>',
    ].join(''),
  };
}

function formatSenderAddress(senderName, fromEmail) {
  const trimmed = fromEmail.trim();
  const match = trimmed.match(/<([^>]+)>/);
  const email = match?.[1]?.trim() || trimmed.replace(/[<>]/g, '').trim();
  const name = senderName.trim().replaceAll(/[\r\n<>"]/g, '') || 'PhotoZ';
  return `${name} <${email}>`;
}

async function sendSelectionNotificationEmail({ recipientEmail, senderName, galleryId, galleryTitle, customerName, customerMessage, selectedCount, submittedAt }) {
  if (!config.RESEND_API_KEY) {
    console.error('[mail] 缺少环境变量：RESEND_API_KEY');
    return;
  }
  if (!config.NOTIFICATION_FROM_EMAIL) {
    console.error('[mail] 缺少环境变量：NOTIFICATION_FROM_EMAIL');
    return;
  }
  if (!recipientEmail) {
    console.error('[mail] 摄影师通知邮箱为空');
    return;
  }

  const mail = buildSelectionNotificationEmail({
    galleryId,
    galleryTitle,
    customerName,
    customerMessage,
    selectedCount,
    submittedAt,
    siteUrl: getSiteUrl(),
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: formatSenderAddress('PhotoZ 📷', config.NOTIFICATION_FROM_EMAIL),
      to: [recipientEmail],
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`邮件发送失败：${response.status} ${await response.text()}`);
  }
}

module.exports = { sendSelectionNotificationEmail, getSiteUrl };
