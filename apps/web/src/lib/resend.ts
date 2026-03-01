import { Resend } from "resend";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY!);
  }
  return _resend;
}

export async function sendConfirmationEmail({
  to,
  projectName,
  confirmUrl,
}: {
  to: string;
  projectName: string;
  confirmUrl: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: "ChangelogKit <noreply@changelogkit.threestack.io>",
    to,
    subject: `Confirm your subscription to ${projectName}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#6366f1">Confirm your subscription</h2>
        <p>You've subscribed to changelog updates for <strong>${projectName}</strong>.</p>
        <p>Click the button below to confirm your email address:</p>
        <a href="${confirmUrl}"
           style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Confirm subscription
        </a>
        <p style="color:#6b7280;font-size:14px">If you didn't subscribe, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendChangelogEmail({
  to,
  projectName,
  entryTitle,
  bodyHtml,
  changelogUrl,
  unsubscribeUrl,
}: {
  to: string;
  projectName: string;
  entryTitle: string;
  bodyHtml: string;
  changelogUrl: string;
  unsubscribeUrl: string;
}) {
  const resend = getResend();
  await resend.emails.send({
    from: `${projectName} <noreply@changelogkit.threestack.io>`,
    to,
    subject: `New update: ${entryTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#6366f1">${entryTitle}</h1>
        ${bodyHtml}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />
        <p style="color:#6b7280;font-size:12px">
          You're receiving this because you subscribed to ${projectName} updates.
          <a href="${changelogUrl}" style="color:#6366f1">View changelog</a> ·
          <a href="${unsubscribeUrl}" style="color:#6b7280">Unsubscribe</a>
        </p>
      </div>
    `,
  });
}
