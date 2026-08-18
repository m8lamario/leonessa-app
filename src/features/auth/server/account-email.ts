import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { Resend } from "resend";

import { env } from "@/env";
import { AppError } from "@/utils/errors";

function getResendClient() {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) {
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      "Il servizio email non è configurato. Riprova più tardi.",
      503,
    );
  }

  return new Resend(env.RESEND_API_KEY);
}

function emailLayout(title: string, body: string, actionLabel: string, actionUrl: string) {
  return `
    <!doctype html>
    <html lang="it">
      <body style="margin:0;padding:0;background:#071034">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#071034">
          <tr>
            <td align="center" style="padding:40px 16px">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#131e52;border-radius:16px">
                <tr>
                  <td style="padding:36px 32px;font-family:Arial,sans-serif;color:#ffffff">
                    <img src="cid:leonessa-logo" alt="Leonessa Cup" width="52" style="display:block;width:52px;height:auto;margin:0 0 22px" />
                    <p style="margin:0 0 24px;color:#b9c8ff;font-size:13px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase">Leonessa Cup</p>
                    <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1">${title}</h1>
                    <p style="margin:0 0 28px;color:#c6ccda;font-size:16px;line-height:1.6">${body}</p>
                    <a href="${actionUrl}" style="display:inline-block;padding:15px 22px;border-radius:8px;background:#305cff;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none">${actionLabel}</a>
                    <p style="margin:36px 0 0;padding-top:20px;border-top:1px solid #2b376c;color:#8d95a6;font-size:13px">Leonessa Cup · La community ufficiale degli studenti</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

async function sendEmail(input: {
  to: string;
  subject: string;
  title: string;
  body: string;
  actionLabel: string;
  actionUrl: string;
}) {
  const logo = await readFile(join(process.cwd(), "public", "logo", "logo leonessa bianco.png"));
  const response = await getResendClient().emails.send({
    from: env.RESEND_FROM_EMAIL!,
    to: input.to,
    subject: input.subject,
    html: emailLayout(input.title, input.body, input.actionLabel, input.actionUrl),
    attachments: [
      {
        filename: "logo-leonessa.png",
        content: logo,
        contentId: "leonessa-logo",
      },
    ],
  });

  if (response.error) {
    throw new AppError(
      "SERVICE_UNAVAILABLE",
      "Non è stato possibile inviare l'email. Riprova.",
      503,
    );
  }
}

export function getVerificationUrl(token: string) {
  return new URL(`/verify-email?token=${token}`, env.NEXT_PUBLIC_APP_URL).toString();
}

export function getPasswordResetUrl(token: string) {
  return new URL(`/reset-password?token=${token}`, env.NEXT_PUBLIC_APP_URL).toString();
}

export function sendVerificationEmail(email: string, token: string) {
  return sendEmail({
    to: email,
    subject: "Verifica il tuo account Leonessa Cup",
    title: "Benvenuto nella Leonessa Cup",
    body: "Verifica il tuo account per completare la registrazione e ottenere 25 LP.",
    actionLabel: "Verifica Account",
    actionUrl: getVerificationUrl(token),
  });
}

export function sendPasswordResetEmail(email: string, token: string) {
  return sendEmail({
    to: email,
    subject: "Recupero Password Leonessa Cup",
    title: "Recupera la tua password",
    body: "Hai richiesto di reimpostare la password del tuo account Leonessa Cup.",
    actionLabel: "Reimposta Password",
    actionUrl: getPasswordResetUrl(token),
  });
}
