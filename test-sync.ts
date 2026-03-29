
import 'dotenv/config'
import fetch from 'node-fetch'
import { FormData } from 'formdata-node'
import { File } from 'formdata-node'

// Since we are testing in terminal, we might need to install these if they are not global
// But wait! Next.js has them.

async function test() {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) {
       console.log('No token found')
       return
    }
    
    // Test fetch with FormData
    const formData = new FormData()
    // Use a dummy image
    const response = await fetch('https://via.placeholder.com/512.png')
    const buffer = await response.buffer()
    
    formData.append('photo', new File([buffer], 'photo.png', { type: 'image/png' }))
    
    console.log('Testing setMyProfilePhoto...')
    const res = await fetch(`https://api.telegram.org/bot${token}/setMyProfilePhoto`, {
        method: 'POST',
        body: formData
    })
    
    const data = await res.json()
    console.log('Result:', data)
}

test()
