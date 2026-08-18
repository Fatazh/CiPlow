// server/utils/email.ts
// Email service utility using Nodemailer (SMTP)

import nodemailer from 'nodemailer'

interface SendResetPasswordOptions {
  to: string
  userName?: string
  resetUrl: string
}

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (transporter) return transporter

  const host = process.env.SMTP_HOST || 'smtp.gmail.com'
  const port = Number(process.env.SMTP_PORT) || 465
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!user || !pass) {
    console.warn('[Email] SMTP_USER atau SMTP_PASS belum diset di .env')
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: {
      user,
      pass,
    },
  })

  return transporter
}

/**
 * Sends a password reset email with a responsive HTML template
 */
export async function sendResetPasswordEmail({ to, userName, resetUrl }: SendResetPasswordOptions) {
  const mailer = getTransporter()
  const fromName = process.env.SMTP_FROM || `CashPlow <${process.env.SMTP_USER || 'noreply@cashplow.com'}>`
  const displayName = userName || 'Pengguna CashPlow'

  const htmlContent = `
  <!DOCTYPE html>
  <html lang="id">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password CashPlow</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        background-color: #f8fafc;
        margin: 0;
        padding: 0;
        color: #334155;
      }
      .container {
        max-width: 560px;
        margin: 40px auto;
        background-color: #ffffff;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
        border: 1px solid #f1f5f9;
      }
      .header {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        padding: 36px 32px;
        text-align: center;
      }
      .header h1 {
        margin: 0;
        color: #ffffff;
        font-size: 24px;
        font-weight: 800;
        letter-spacing: -0.5px;
      }
      .header p {
        margin: 6px 0 0 0;
        color: rgba(255, 255, 255, 0.9);
        font-size: 13px;
        font-weight: 500;
      }
      .content {
        padding: 36px 32px;
      }
      .greeting {
        font-size: 16px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 12px;
      }
      .text {
        font-size: 14px;
        line-height: 1.6;
        color: #64748b;
        margin-bottom: 24px;
      }
      .btn-container {
        text-align: center;
        margin: 32px 0;
      }
      .btn {
        display: inline-block;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: #ffffff !important;
        text-decoration: none;
        padding: 14px 32px;
        font-size: 14px;
        font-weight: 700;
        border-radius: 14px;
        box-shadow: 0 4px 14px 0 rgba(16, 185, 129, 0.35);
      }
      .warning-box {
        background-color: #fef2f2;
        border-left: 4px solid #ef4444;
        padding: 14px 16px;
        border-radius: 10px;
        margin: 24px 0;
      }
      .warning-box p {
        margin: 0;
        font-size: 12px;
        color: #991b1b;
        line-height: 1.5;
      }
      .fallback-url {
        font-size: 12px;
        color: #94a3b8;
        word-break: break-all;
        background-color: #f8fafc;
        padding: 12px;
        border-radius: 8px;
        margin-top: 16px;
      }
      .footer {
        background-color: #f8fafc;
        padding: 24px 32px;
        text-align: center;
        border-top: 1px solid #f1f5f9;
      }
      .footer p {
        margin: 4px 0;
        font-size: 11px;
        color: #94a3b8;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🌱 CashPlow</h1>
        <p>Budget Tracker & Financial Management</p>
      </div>
      <div class="content">
        <div class="greeting">Halo, ${displayName}! 👋</div>
        <p class="text">
          Kami menerima permintaan untuk mereset kata sandi akun CashPlow Anda. Klik tombol di bawah ini untuk membuat kata sandi baru:
        </p>
        
        <div class="btn-container">
          <a href="${resetUrl}" target="_blank" class="btn">Reset Password Saya</a>
        </div>

        <div class="warning-box">
          <p>⚠️ <strong>Perhatian:</strong> Tautan ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa meminta reset password, abaikan email ini dan akun Anda akan tetap aman.</p>
        </div>

        <p class="text" style="font-size: 12px; margin-bottom: 6px;">Jika tombol di atas tidak berfungsi, salin dan tempel URL berikut ke browser Anda:</p>
        <div class="fallback-url">${resetUrl}</div>
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} CashPlow. Seluruh hak cipta dilindungi undang-undang.</p>
        <p>Email ini dikirim secara otomatis, mohon untuk tidak membalas email ini.</p>
      </div>
    </div>
  </body>
  </html>
  `

  return mailer.sendMail({
    from: fromName,
    to,
    subject: '🔐 Reset Password Akun CashPlow',
    text: `Halo ${displayName},\n\nKlik tautan berikut untuk mereset password akun CashPlow Anda: ${resetUrl}\n\nTautan ini hanya berlaku selama 1 jam.\nJika Anda tidak meminta reset password, abaikan email ini.`,
    html: htmlContent,
  })
}
