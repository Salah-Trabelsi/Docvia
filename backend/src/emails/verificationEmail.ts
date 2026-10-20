function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character]!,
  );
}

export function verificationEmail(firstName: string, url: string) {
  const name = escapeHtml(firstName);
  const link = escapeHtml(url);

  const logoUrl =
    "https://res.cloudinary.com/dziigmgig/image/upload/v1792351119/docvia-logo.png";

  return {
    subject: "Verify your Docvia email address",
    text:
      `Welcome to Docvia, ${firstName}!\n\n` +
      `Please verify your email address:\n${url}\n\n` +
      `This link expires in 24 hours and can be used only once.\n\n` +
      `If you did not create a Docvia account, you can ignore this email.`,

    html: `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your email</title>
  </head>
  <body style="margin:0;padding:0;background-color:#F8F4EE;font-family:Arial,Helvetica,sans-serif;color:#172433;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#F8F4EE;margin:0;padding:0;">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table
            role="presentation"
            width="100%"
            cellspacing="0"
            cellpadding="0"
            style="max-width:600px;background-color:#FFFFFF;border-radius:20px;overflow:hidden;"
          >
            <tr>
              <td style="padding:32px 32px 16px 32px;text-align:center;background-color:#F4E7D8;">
                <img
                  src="${logoUrl}"
                  alt="Docvia"
                  width="140"
                  style="display:block;margin:0 auto 12px auto;border:0;outline:none;text-decoration:none;"
                />
                <p style="margin:0;font-size:14px;line-height:1.6;color:#6B7280;">
                  Trusted doctor booking made simple
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px 0;font-size:28px;line-height:1.3;color:#172433;">
                  Welcome, ${name}!
                </h1>

                <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#334155;">
                  Thank you for joining <strong>Docvia</strong>. Please verify your email address to activate your account and keep your profile up to date.
                </p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:28px auto;">
                  <tr>
                    <td align="center" bgcolor="#D97732" style="border-radius:12px;">
                      <a
                        href="${link}"
                        style="display:inline-block;padding:16px 28px;font-size:16px;font-weight:700;line-height:1;text-decoration:none;color:#FFFFFF;background-color:#D97732;border-radius:12px;"
                      >
                        Verify Email
                      </a>
                    </td>
                  </tr>
                </table>

                <table
                  role="presentation"
                  width="100%"
                  cellspacing="0"
                  cellpadding="0"
                  style="margin:24px 0;background-color:#FAF1E7;border-radius:12px;"
                >
                  <tr>
                    <td style="padding:16px 18px;font-size:14px;line-height:1.7;color:#7C4A22;">
                      This verification link expires in <strong>24 hours</strong> and can only be used once.
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 10px 0;font-size:14px;line-height:1.7;color:#475569;">
                  If the button does not work, copy and paste this link into your browser:
                </p>

                <p style="margin:0 0 24px 0;font-size:13px;line-height:1.7;word-break:break-all;overflow-wrap:anywhere;">
                  <a href="${link}" style="color:#A34B18;text-decoration:underline;">${link}</a>
                </p>

                <p style="margin:0;font-size:13px;line-height:1.7;color:#6B7280;">
                  If you did not create a Docvia account, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:20px 32px;text-align:center;background-color:#FFF8F2;border-top:1px solid #F1E5D8;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#94A3B8;">
                  © Docvia • Secure healthcare appointment platform
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:#94A3B8;">
            Sent by Docvia
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
    `,
  };
}
