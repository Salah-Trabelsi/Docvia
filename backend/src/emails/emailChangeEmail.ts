function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!)
}

function layout(title: string, content: string) {
  return `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#F8F4EE;font-family:Arial,Helvetica,sans-serif;color:#172433;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
<tr><td style="padding:32px;text-align:center;background:#F4E7D8;"><img src="https://res.cloudinary.com/dziigmgig/image/upload/v1792351119/docvia-logo.png" alt="Docvia" width="140" style="display:block;margin:auto;border:0;"></td></tr>
<tr><td style="padding:32px;font-size:16px;line-height:1.7;"><h1 style="font-size:26px;line-height:1.3;">${title}</h1>${content}</td></tr>
</table></td></tr></table></body></html>`
}

export function emailChangeConfirmation(firstName: string, url: string) {
  const link = escapeHtml(url)
  return {
    subject: 'Confirm your new Docvia email address',
    text: `Hello ${firstName},\n\nConfirm this as your new Docvia email address:\n${url}\n\nThis link expires in 30 minutes and can only be used once. Your current email stays unchanged until confirmation. Confirming signs you out of existing sessions. If you did not request this change, ignore this email.`,
    html: layout('Confirm your new email', `<p>Hello ${escapeHtml(firstName)},</p><p>Please confirm this as your new Docvia email address. Your current email stays unchanged until you confirm.</p>
<p style="text-align:center;margin:28px 0;"><a href="${link}" style="display:inline-block;padding:16px 28px;background:#D97732;color:#172433;border-radius:12px;text-decoration:none;font-weight:bold;">Confirm New Email</a></p>
<p style="padding:16px;background:#FAF1E7;border-radius:12px;">This link expires in <strong>30 minutes</strong> and can only be used once. Confirming signs you out of existing sessions.</p>
<p>If the button does not work, copy this URL into your browser:</p><p style="word-break:break-all;overflow-wrap:anywhere;font-size:13px;"><a href="${link}" style="color:#A34B18;">${link}</a></p>
<p style="font-size:13px;color:#6B7280;">If you did not request this change, ignore this email.</p>`),
  }
}

export function emailChangedNotification(firstName: string) {
  return {
    subject: 'Your Docvia email address was changed',
    text: `Hello ${firstName},\n\nYour Docvia account email address has been changed. Existing sessions have been signed out. If you did not authorize this change, contact Docvia support immediately.`,
    html: layout('Your email address was changed', `<p>Hello ${escapeHtml(firstName)},</p><p>Your Docvia account email address has been changed. Existing sessions have been signed out.</p><p style="padding:16px;background:#FAF1E7;border-radius:12px;">If you did not authorize this change, contact Docvia support immediately.</p>`),
  }
}
