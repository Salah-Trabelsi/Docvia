function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
}

export function passwordResetEmail(firstName: string, url: string) {
  const name = escapeHtml(firstName);
  const link = escapeHtml(url);
  const logo =
    "https://res.cloudinary.com/dziigmgig/image/upload/v1792351119/docvia-logo.png";
  return {
    subject: "Reset your Docvia password",
    text: `Hello ${firstName},\n\nWe received a request to reset your Docvia password.\n${url}\n\nThis link expires in 30 minutes and can only be used once. Resetting your password signs you out of existing sessions. If you did not request this, ignore this email; your password will not change.`,
    html: `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Reset your Docvia password</title></head>
<body style="margin:0;background:#F8F4EE;font-family:Arial,Helvetica,sans-serif;color:#172433;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:20px;overflow:hidden;">
<tr><td style="padding:32px;text-align:center;background:#F4E7D8;"><img src="${logo}" alt="Docvia" width="140" style="display:block;margin:auto;border:0;"><p style="color:#6B7280;font-size:14px;">Trusted doctor booking made simple</p></td></tr>
<tr><td style="padding:32px;"><h1 style="font-size:26px;line-height:1.3;">Reset your password</h1>
<p style="font-size:16px;line-height:1.7;">Hello ${name}, we received a request to reset your Docvia password.</p>
<p style="text-align:center;margin:28px 0;"><a href="${link}" style="display:inline-block;padding:16px 28px;background:#D97732;color:#172433;border-radius:12px;text-decoration:none;font-weight:bold;">Reset Password</a></p>
<p style="padding:16px;background:#FAF1E7;border-radius:12px;font-size:14px;line-height:1.7;">This link expires in <strong>30 minutes</strong> and can only be used once. Resetting your password signs you out of existing sessions.</p>
<p style="font-size:14px;line-height:1.7;">If the button does not work, copy and paste this link into your browser:</p>
<p style="word-break:break-all;overflow-wrap:anywhere;font-size:13px;line-height:1.7;"><a href="${link}" style="color:#A34B18;">${link}</a></p>
<p style="font-size:13px;line-height:1.7;color:#6B7280;">If you did not request this, ignore this email. Your password will not change.</p>
</td></tr></table></td></tr></table></body></html>`,
  };
}
