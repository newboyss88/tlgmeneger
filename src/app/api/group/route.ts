import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const groups = await prisma.group.findMany({
      where: { bot: { userId: (session.user as any).id } },
      include: { bot: { select: { token: true, name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Group GET error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { chatId, botId, language } = await request.json()

    if (!chatId || !botId) {
      return NextResponse.json({ error: 'Chat ID va bot tanlang' }, { status: 400 })
    }

    // Get bot token
    const bot = await prisma.bot.findUnique({ where: { id: botId } })
    if (!bot) return NextResponse.json({ error: 'Bot topilmadi' }, { status: 404 })

    // Verify group with Telegram API
    const chatRes = await fetch(`https://api.telegram.org/bot${bot.token}/getChat?chat_id=${chatId}`)
    const chatData = await chatRes.json()

    if (!chatData.ok) {
      return NextResponse.json({ error: 'Guruh topilmadi. Chat ID ni tekshiring va bot guruhga admin sifatida qo\'shilganligini tekshiring.' }, { status: 400 })
    }

    const title = chatData.result.title || 'Guruh'
    const chatType = chatData.result.type || 'supergroup'

    // Check if group already exists
    const existing = await prisma.group.findFirst({
      where: { chatId: chatId.toString() },
    })

    if (existing) {
      // Update existing
      const group = await (prisma.group as any).update({
        where: { id: existing.id },
        data: { title, type: chatType, isActive: true, language: language || 'uz' },
      })
      return NextResponse.json(group)
    }

    const group = await (prisma.group as any).create({
      data: {
        chatId: chatId.toString(),
        title,
        type: chatType,
        isActive: true,
        autoReply: true,
        botId,
        language: language || 'uz',
      },
    })

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Group',
        entityId: group.id,
        details: JSON.stringify({ chatId, title }),
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Group POST error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, autoReply, title, description, avatar, language } = await request.json()
    if (!id) return NextResponse.json({ error: 'Group ID kerak' }, { status: 400 })

    const group = await prisma.group.findUnique({ where: { id }, include: { bot: true } })
    if (!group) return NextResponse.json({ error: 'Group topilmadi' }, { status: 404 })

    const botToken = group.bot.token
    const chatId = group.chatId

    if (title && title !== group.title) {
       await fetch(`https://api.telegram.org/bot${botToken}/setChatTitle`, {
           method: 'POST', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ chat_id: chatId, title })
       })
    }
    if (description !== undefined) {
       await fetch(`https://api.telegram.org/bot${botToken}/setChatDescription`, {
           method: 'POST', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ chat_id: chatId, description })
       })
    }
    let telegramSyncSuccess = false
    let telegramError = null
    if (avatar && avatar.startsWith('data:image')) {
       try {
         console.log('[API GROUP] Attempting to sync avatar to Telegram...')
         const base64Data = avatar.split(',')[1]
         const mimeType = avatar.split(',')[0].match(/:([^;]+);/)?.[1] || 'image/jpeg'
         const buffer = Buffer.from(base64Data, 'base64')
         
         try {
           console.log('[API GROUP] Sending setChatPhoto via manual multipart Buffer...')
           const boundary = `----WebKitFormBoundaryGroupAvatar${Date.now()}`
           const start = `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="avatar.jpg"\r\nContent-Type: ${mimeType}\r\n\r\n`
           const end = `\r\n--${boundary}--\r\n`
           
           const payload = Buffer.concat([
             Buffer.from(start, 'utf-8'),
             buffer,
             Buffer.from(end, 'utf-8')
           ])

           const pRes = await fetch(`https://api.telegram.org/bot${botToken}/setChatPhoto?chat_id=${chatId}`, {
             method: 'POST',
             headers: {
               'Content-Type': `multipart/form-data; boundary=${boundary}`
             },
             body: payload
           })
           const pData = await pRes.json()
           
           if (pData.ok) {
             console.log('[API GROUP] Telegram setChatPhoto SUCCESS')
             telegramSyncSuccess = true
           } else {
             console.error(`[API GROUP] Telegram setChatPhoto FAILED: ${pData.description}`)
             telegramError = pData.description
           }
         } catch (pError: any) {
           console.error(`[API GROUP] Telegram setChatPhoto Technical Error: ${pError.message}`)
           telegramError = pError.message
         }
       } catch (err) {
         console.error('[API GROUP] Group Avatar sync technical error:', err)
       }
    }

    let updatedGroup: any = null
    try {
      // 1. First update basic fields (excluding avatar and description because description is not in schema)
      const basicFields = {
        ...(autoReply !== undefined && { autoReply }),
        ...(title && { title }),
        ...(language !== undefined && { language }),
      }

      updatedGroup = await (prisma.group as any).update({
        where: { id },
        data: basicFields,
      })

      // 2. Then try to update avatar separately if provided
      if (avatar !== undefined) {
         try {
           updatedGroup = await (prisma.group as any).update({
             where: { id },
             data: { avatar },
           })
         } catch (avError) {
           console.error('[API GROUP] Avatar DB update failed (likely size):', avError)
           telegramError = telegramError || 'Rasm bazaga saqlanmadi (hajmi kattalik qilishi mumkin), lekin Telegram-da yangilangan bo\'lishi mumkin.'
         }
      }
      
      if (avatar && !telegramSyncSuccess) {
         return NextResponse.json({
           ...updatedGroup,
           warning: 'Telegram-da rasm o\'zgarmadi. Sababi: ' + (telegramError || 'Noma\'lum xato')
         })
      }
      
      if (telegramError && telegramSyncSuccess) {
        return NextResponse.json({
          ...updatedGroup,
          warning: telegramError
        })
      }

      return NextResponse.json(updatedGroup)
    } catch (dbError: any) {
      console.error('[API GROUP] Critical Database update failed:', dbError)
      return NextResponse.json({ error: 'Ma\'lumotlarni saqlashda xato: ' + dbError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('Group PUT error:', error)
    return NextResponse.json({ error: 'Server error: ' + error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return NextResponse.json({ error: 'Group ID kerak' }, { status: 400 })

    await prisma.group.delete({
      where: { id },
    })

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Group',
        entityId: id,
        details: '{}',
        userId: (session.user as any).id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Group DELETE error:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
