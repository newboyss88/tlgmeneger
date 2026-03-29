import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'
import fs from 'fs'

const prisma = new PrismaClient()

const run = async () => {
    const bot = await prisma.bot.findFirst()
    if (!bot) {
      console.log('No bot found in DB')
      return;
    }
    const token = bot.token;
    console.log('Testing bot token:', token.substring(0, 10) + '...');
    
    // Read the actual dummy image
    const imagePath = 'dummy.jpg';
    if (!fs.existsSync(imagePath)) {
        const dummyBuf = Buffer.alloc(100, 'A');
        fs.writeFileSync(imagePath, dummyBuf);
    }
    const buffer = fs.readFileSync(imagePath);

    const boundary = `----WebKitFormBoundaryBotAvatar${Date.now()}`
    const start = `--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="avatar.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`
    const end = `\r\n--${boundary}--\r\n`
    
    const payload = Buffer.concat([
      Buffer.from(start, 'utf-8'),
      buffer,
      Buffer.from(end, 'utf-8')
    ])

    const res = await fetch(`https://api.telegram.org/bot${token}/setMyProfilePhoto`, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: payload
    })
    
    const data = await res.json()
    console.log('[API BOT POST buffer] Result:', data)

    // Test with FormData and Blob to see if it makes a difference inside Node.js
    const FormData = require('form-data');
    const fd = new FormData();
    fd.append('photo', buffer, 'avatar.jpg');
    
    const res2 = await fetch(`https://api.telegram.org/bot${token}/setMyProfilePhoto`, {
        method: 'POST',
        body: fd
    })
    const data2 = await res2.json()
    console.log('[API BOT form-data package] Result:', data2)
}

run().catch(console.error).finally(() => prisma.$disconnect())
