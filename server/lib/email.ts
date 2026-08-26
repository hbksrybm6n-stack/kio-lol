import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailum.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

const FROM = process.env.SMTP_FROM || 'kio.lol <noreply@kio.lol>';

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_USER) {
    console.log(`[EMAIL MOCK] To: ${to} | Subject: ${subject}`);
    return { ok: true, mock: true };
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    return { ok: true };
  } catch (err: any) {
    console.error('Email error:', err.message);
    return { ok: false, error: err.message };
  }
}

export function verificationEmailHtml(token: string) {
  const url = process.env.APP_URL || 'https://kio.lol';
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px"><h2 style="color:#111">Verify your email</h2><p style="color:#555;line-height:1.6">Click below to verify your email for kio.lol:</p><a href="${url}/verify-email?token=${token}" style="display:inline-block;padding:12px 24px;background:#8b5cf6;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">Verify Email</a><p style="color:#999;font-size:12px">Expires in 24h. Ignore if you didn't sign up.</p></div>`;
}

export function passwordResetEmailHtml(token: string) {
  const url = process.env.APP_URL || 'https://kio.lol';
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px"><h2 style="color:#111">Reset your password</h2><p style="color:#555;line-height:1.6">Click below to reset your kio.lol password:</p><a href="${url}/reset-password?token=${token}" style="display:inline-block;padding:12px 24px;background:#ef4444;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin:16px 0">Reset Password</a><p style="color:#999;font-size:12px">Expires in 1h. Ignore if you didn't request this.</p></div>`;
}

export function loginNotificationHtml(ip: string, userAgent: string) {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px"><h2 style="color:#111">New login</h2><div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0"><p style="margin:4px 0;color:#333"><strong>IP:</strong> ${ip}</p><p style="margin:4px 0;color:#333"><strong>Device:</strong> ${userAgent}</p><p style="margin:4px 0;color:#333"><strong>Time:</strong> ${new Date().toLocaleString()}</p></div><p style="color:#999;font-size:12px">If this wasn't you, change your password.</p></div>`;
}

export function securityAlertHtml(action: string) {
  return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px"><h2 style="color:#ef4444">Security Alert</h2><p style="color:#555;line-height:1.6">${action}</p><p style="color:#999;font-size:12px">If this wasn't you, secure your account immediately.</p></div>`;
}
