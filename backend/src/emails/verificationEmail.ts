function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]!)
}

export function verificationEmail(firstName: string, url: string) {
  const name = escapeHtml(firstName)
  const link = escapeHtml(url)
  return {
    subject: 'Verify your Docvia email address',
    text: `Welcome to Docvia, ${firstName}!\n\nPlease verify your email address:\n${url}\n\nThis link expires in 24 hours and can be used only once. If you did not create a Docvia account, you can ignore this email.`,
    html: `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#F8F6F2;font-family:Arial,sans-serif;color:#172433;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border-radius:16px;">
<tr><td style="padding:32px 24px;">
<p style="margin:0 0 24px;font-size:30px;font-weight:bold;color:#A34B18;text-align:center;">Docvia</p>
<h1 style="font-size:24px;line-height:1.3;">Welcome, ${name}!</h1>
<p style="font-size:16px;line-height:1.6;">Thank you for joining Docvia. Verify your email address to keep your account up to date.</p>
<p style="margin:28px 0;text-align:center;"><a href="${link}" style="display:inline-block;padding:16px 28px;background:#D97732;color:#172433;border-radius:10px;font-size:16px;font-weight:bold;text-decoration:none;">Verify Email</a></p>
<p style="padding:16px;background:#F7E8DA;border-radius:10px;font-size:14px;line-height:1.6;">This link expires in 24 hours and can be used only once.</p>
<p style="font-size:14px;line-height:1.6;">If the button does not work, copy and paste this URL into your browser:</p>
<p style="word-break:break-all;overflow-wrap:anywhere;font-size:13px;line-height:1.6;"><a href="${link}" style="color:#A34B18;">${link}</a></p>
<p style="font-size:12px;line-height:1.6;color:#536176;">If you did not create a Docvia account, you can ignore this email.</p>
</td></tr></table></td></tr></table></body></html>`,
  }
}
