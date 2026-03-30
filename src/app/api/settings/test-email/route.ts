import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, smtp } = await request.json()

    if (!email || !smtp.host || !smtp.user || !smtp.pass) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const port = parseInt(smtp.port || '587')
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port,
      secure: port === 465,
      auth: {
         user: smtp.user,
         pass: smtp.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    })

    await transporter.sendMail({
      from: `"SMTP Test" <${smtp.from || smtp.user}>`,
      to: email,
      subject: 'TelegramManager SMTP Test',
      text: 'Tabriklaymiz! SMTP sozlamalari muvaffaqiyatli o\'rnatildi.',
      html: '<b>Tabriklaymiz!</b> SMTP sozlamalari muvaffaqiyatli o\'rnatildi. 🎉'
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Test Email error:', error)
    return NextResponse.json({ error: error.message || 'SMTP connect error' }, { status: 500 })
  }
}
