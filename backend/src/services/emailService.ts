import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) return transporter;
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('⚠️  SMTP not configured — emails will be logged only');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.log(`📧 [dev] Email to ${to}: ${subject}`);
    return;
  }
  await t.sendMail({
    from: env.SMTP_FROM || env.SMTP_USER,
    to,
    subject,
    html,
  });
}

export function priceAlertEmailHtml(params: {
  userName: string;
  destination: string;
  oldTotal: number;
  newTotal: number;
  diff: number;
  diffPercent: number;
  simulationUrl: string;
}): string {
  const isDrop = params.diff < 0;
  const color = isDrop ? '#059669' : '#dc2626';
  const arrow = isDrop ? '📉' : '📈';
  const verb = isDrop ? 'baissé' : 'augmenté';

  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff">
      <h2 style="color:#111;margin:0 0 8px">${arrow} Alerte prix : ${params.destination}</h2>
      <p style="color:#555;line-height:1.5">Bonjour ${params.userName}, le budget de votre voyage a <strong style="color:${color}">${verb} de ${Math.abs(params.diffPercent)}%</strong>.</p>
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e5e7eb">
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="color:#6b7280">Budget initial</span>
          <span style="text-decoration:line-through;color:#9ca3af">${params.oldTotal.toLocaleString()}€</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:18px">
          <span>Budget actuel</span>
          <span style="color:${color}">${params.newTotal.toLocaleString()}€</span>
        </div>
        <div style="margin-top:8px;font-size:14px;color:${color};text-align:right">
          ${params.diff > 0 ? '+' : ''}${params.diff.toLocaleString()}€
        </div>
      </div>
      <a href="${params.simulationUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Voir ma simulation</a>
      <p style="color:#9ca3af;font-size:12px;margin-top:24px">Vous recevez cet email car vous avez activé les alertes prix pour cette simulation. Vous pouvez les désactiver à tout moment depuis votre dashboard.</p>
    </div>
  `;
}

export function inviteEmailHtml(params: {
  inviterName: string;
  destination: string;
  acceptUrl: string;
}): string {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#fff">
      <h2 style="color:#111;margin:0 0 8px">🎒 Invitation : ${params.destination}</h2>
      <p style="color:#555;line-height:1.5"><strong>${params.inviterName}</strong> vous invite à collaborer sur sa simulation de voyage.</p>
      <p style="color:#555;line-height:1.5">Vous pourrez voir le budget, l'itinéraire, et laisser des commentaires sur chaque activité.</p>
      <a href="${params.acceptUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:16px">Accepter l'invitation</a>
    </div>
  `;
}
