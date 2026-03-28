import type { Metadata } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'TelegramManager - Bot va Guruh Boshqaruv Platformasi',
  description: 'Telegram bot va guruhlarni professional tarzda boshqaring. Sklad, foydalanuvchilar va barcha sozlamalarni bir joydan nazorat qiling.',
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
