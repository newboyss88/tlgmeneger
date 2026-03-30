/**
 * Simple Telegram Bot API wrapper for sending system notifications
 */
export async function sendTelegramMessage(chatId: string | number, text: string, parseMode: 'HTML' | 'Markdown' = 'HTML') {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    console.error('[TELEGRAM] Bot token not configured in .env');
    return { success: false, error: 'Bot token not configured' };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('[TELEGRAM] API Error:', data);
      return { success: false, error: data.description };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error('[TELEGRAM] Fetch Error:', error);
    return { success: false, error: error.message };
  }
}
