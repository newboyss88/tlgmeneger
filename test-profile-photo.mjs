import fetch from 'node-fetch'
import fs from 'fs'

const run = async () => {
    const token = '8611142801:AAEgRzS2E7K6T6d5oYg_BvH9k4L_6yX-1C0';
    console.log('Sending setMyProfilePhoto via Manual Buffer...');
    
    // Create a dummy image or read existing one
    const imagePath = 'dummy.jpg';
    if (!fs.existsSync(imagePath)) {
        // Create 100 bytes of dummy data
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
    console.log('[API BOT] Result:', data)
}
run();
