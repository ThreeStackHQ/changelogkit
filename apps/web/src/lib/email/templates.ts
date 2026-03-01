const BRAND_COLOR = "#10b77f";

/**
 * Confirmation email sent after subscribing.
 */
export function confirmationEmailHtml({
  projectName,
  confirmUrl,
}: {
  projectName: string;
  confirmUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirm your subscription</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-width:520px;">
          <!-- Header -->
          <tr>
            <td style="background:${BRAND_COLOR};padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">ChangelogKit</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">${projectName} changelog</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:20px;font-weight:700;color:#0f172a;">Confirm your subscription</h1>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                You asked to receive updates from <strong>${projectName}</strong>. Click the button below to confirm your email address and start receiving changelog notifications.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:${BRAND_COLOR};">
                    <a href="${confirmUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">
                      Confirm subscription →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
                If you didn't subscribe, you can safely ignore this email — you won't receive any more emails from us.<br/>
                Or copy this link: <a href="${confirmUrl}" style="color:${BRAND_COLOR};">${confirmUrl}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;color:#cbd5e1;font-size:11px;">Powered by <a href="https://changelogkit.threestack.io" style="color:${BRAND_COLOR};text-decoration:none;">ChangelogKit</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Changelog entry blast email.
 */
export function entryBlastEmailHtml({
  projectName,
  projectColor,
  entryTitle,
  category,
  contentHtml,
  changelogUrl,
  unsubscribeUrl,
}: {
  projectName: string;
  projectColor: string;
  entryTitle: string;
  category: string;
  contentHtml: string;
  changelogUrl: string;
  unsubscribeUrl: string;
}): string {
  const categoryConfig: Record<string, { label: string; emoji: string; color: string; bg: string }> = {
    feature:     { label: "Feature",     emoji: "✨", color: "#1d4ed8", bg: "#eff6ff" },
    fix:         { label: "Fix",         emoji: "🐛", color: "#dc2626", bg: "#fef2f2" },
    improvement: { label: "Improvement", emoji: "⚡", color: "#d97706", bg: "#fffbeb" },
    breaking:    { label: "Breaking",    emoji: "⚠️", color: "#ea580c", bg: "#fff7ed" },
    security:    { label: "Security",    emoji: "🔒", color: "#059669", bg: "#f0fdf4" },
  };
  const cat = categoryConfig[category] ?? { label: category, emoji: "📋", color: "#6366f1", bg: "#f5f3ff" };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${entryTitle}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-width:560px;">
          <!-- Header -->
          <tr>
            <td style="background:${projectColor};padding:28px 32px;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">${projectName}</p>
              <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">New changelog update</p>
            </td>
          </tr>
          <!-- Entry -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <!-- Category badge -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                <tr>
                  <td style="background:${cat.bg};border:1px solid ${cat.color}20;border-radius:20px;padding:4px 12px;">
                    <span style="color:${cat.color};font-size:12px;font-weight:600;">${cat.emoji} ${cat.label}</span>
                  </td>
                </tr>
              </table>
              <!-- Title -->
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${entryTitle}</h1>
              <!-- Content -->
              <div style="color:#475569;font-size:14px;line-height:1.7;">${contentHtml}</div>
            </td>
          </tr>
          <!-- CTA -->
          <tr>
            <td style="padding:0 32px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:8px;background:${projectColor};">
                    <a href="${changelogUrl}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-weight:600;font-size:14px;text-decoration:none;border-radius:8px;">
                      Read full changelog →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;color:#cbd5e1;font-size:11px;line-height:1.6;">
                You're receiving this because you subscribed to <strong>${projectName}</strong> changelog updates.<br/>
                <a href="${unsubscribeUrl}" style="color:#94a3b8;text-decoration:underline;">Unsubscribe</a> · Powered by <a href="https://changelogkit.threestack.io" style="color:${BRAND_COLOR};text-decoration:none;">ChangelogKit</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
