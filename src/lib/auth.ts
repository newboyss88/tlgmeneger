import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        code: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email/telefon va parol kiriting')
        }

        const input = credentials.email.trim()

        // Foydalanuvchini topish
        let user
        if (input.startsWith('+') || /^\d{9,}$/.test(input)) {
          user = await prisma.user.findFirst({ where: { phone: input } })
        } else {
          user = await prisma.user.findUnique({ where: { email: input } })
        }

        if (!user) {
          throw new Error('Foydalanuvchi topilmadi')
        }

        const { translations } = require('./i18n/translations')
        const t = translations[(user as any).language || 'uz']

        if (user.isBlocked) {
          throw new Error(t.banned_msg || 'Sizning hisobingiz bloklangan')
        }

        const isPasswordValid = await compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error(t.api_error_invalid_password || 'Parol noto\'g\'ri')
        }

        // 2FA tekshiruvi
        if (user.twoFactorEnabled) {
          if (!credentials.code) {
            throw new Error('2FA_REQUIRED')
          }

          const twoFactorCode = await (prisma as any).twoFactorCode.findFirst({
            where: {
              userId: user.id,
              code: credentials.code,
              expiresAt: { gt: new Date() }
            }
          })

          if (!twoFactorCode) {
            throw new Error(t.api_error_token_invalid || 'Tasdiqlash kodi noto\'g\'ri yoki muddati o\'tgan')
          }

          // Koddan foydalanilgandan so'ng o'chirish
          await (prisma as any).twoFactorCode.delete({ where: { id: (twoFactorCode as any).id } })
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          avatar: user.avatar,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.avatar = (user as any).avatar
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).avatar = token.avatar
      }
      return session
    },
  },
}
