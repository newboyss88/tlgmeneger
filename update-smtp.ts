import { createClient } from '@libsql/client';

const url = 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw';

async function updateSmtpPort() {
  const client = createClient({ url, authToken });
  
  try {
    console.log('🔄 SMTP porti 465 ga yangilanmoqda...');
    
    // Check if key exists
    const check = await client.execute("SELECT * FROM Setting WHERE key = 'smtpPort'");
    
    if (check.rows.length > 0) {
      await client.execute({
        sql: "UPDATE Setting SET value = ? WHERE key = 'smtpPort'",
        args: ['465']
      });
      console.log('✅ Port muvaffaqiyatli yangilandi!');
    } else {
      await client.execute({
        sql: "INSERT INTO Setting (id, key, value) VALUES (?, ?, ?)",
        args: [crypto.randomUUID(), 'smtpPort', '465']
      });
      console.log('✅ Port muvaffaqiyatli qo\'shildi!');
    }
    
    process.exit(0);
  } catch (e) {
    console.error('❌ Xatolik yuz berdi:', e);
    process.exit(1);
  }
}

updateSmtpPort();
