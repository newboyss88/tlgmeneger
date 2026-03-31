import nodemailer from 'nodemailer'
import prisma from './prisma'

export async function sendMail({ to, subject, text, html }: { to: string, subject: string, text?: string, html?: string }) {
  // 1. Get SMTP settings from Super Admin (Global config)
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true }
  })

  const smtpSettings = await prisma.setting.findMany({
    where: {
      userId: superAdmin?.id,
      key: { in: ['smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'smtpFrom'] }
    }
  })

  const config = Object.fromEntries(smtpSettings.map(s => [s.key, s.value]))

  const host = config.smtpHost || process.env.SMTP_HOST
  const port = parseInt(config.smtpPort || process.env.SMTP_PORT || '587')
  const user = config.smtpUser || process.env.SMTP_USER
  const pass = config.smtpPass || process.env.SMTP_PASS
  const from = config.smtpFrom || process.env.SMTP_FROM || 'noreply@yourdomain.com'

  if (!host || !user || !pass) {
    console.error('[MAIL] SMTP parameters not configured. Host:', !!host, 'User:', !!user, 'Pass:', !!pass)
    return { success: false, error: 'SMTP parameters not configured' }
  }

  console.log(`[MAIL] Sending to ${to} via ${host}:${port} (Source: ${smtpSettings.length > 0 ? 'DB' : 'ENV'})`)

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  })

  try {
    // Platforma nomini bazadan olish
    const appNameSetting = await prisma.setting.findFirst({
      where: { 
        userId: superAdmin?.id || '',
        key: 'appName'
      }
    })
    const displayName = appNameSetting?.value || process.env.NEXT_PUBLIC_APP_NAME || 'Platform'

    await transporter.sendMail({
      from: `"${displayName}" <${from}>`,
      to,
      subject,
      text,
      html,
    })
    return { success: true }
  } catch (error) {
    console.error('[MAIL] Send error:', error)
    return { success: false, error }
  }
}
