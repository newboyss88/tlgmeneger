import { createClient } from '@libsql/client';

const url = 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw';

async function checkSettings() {
  const client = createClient({ url, authToken });
  
  try {
    const result = await client.execute("SELECT * FROM Setting WHERE key LIKE 'smtp%'");
    console.log('--- SMTP Settings in Turso ---');
    console.table(result.rows.map(row => ({
      key: row.key,
      value: row.key === 'smtpPass' ? '****' : row.value
    })));
  } catch (e) {
    console.error('❌ Xatolik:', e);
  }
}

checkSettings();
