import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Platform'

export const metadata: Metadata = {
  title: `${appName} - Bot va Guruh Boshqaruv Platformasi`,
  description: `${appName} - Telegram bot va guruhlarni professional tarzda boshqaring. Sklad, foydalanuvchilar va barcha sozlamalarni bir joydan nazorat qiling.`,
  keywords: 'telegram, bot, guruh, boshqaruv, sklad, admin panel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="uz">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
