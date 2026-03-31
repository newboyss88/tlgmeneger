import { createClient } from '@libsql/client';

const url = 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw';

async function sync() {
  const client = createClient({ url, authToken });
  
  console.log('--- Phase 1: Correcting Bot Token in Turso ---');
  const botId = 'faf1aaeb-ba96-431b-beb0-e85136d2a159';
  const correctToken = '8611142801:AAEgLNVRM5e0Ee4m8CT0r-tc3FrHh_rP9a8';
  
  try {
    await client.execute({
      sql: "UPDATE Bot SET token = ? WHERE id = ?",
      args: [correctToken, botId]
    });
    console.log('✅ Bot token corrected successfully!');
  } catch (e: any) {
    console.error('❌ Error updating token:', e.message);
  }

  console.log('\n--- Phase 2: Verifying Activation ---');
  try {
    const res = await client.execute({
      sql: "SELECT id, name, isActive FROM Bot WHERE id = ?",
      args: [botId]
    });
    console.log('Bot Status:', JSON.stringify(res.rows, null, 2));
  } catch (e: any) {
    console.error('❌ Error checking status:', e.message);
  }

  console.log('\n--- Sync Finished ---');
  process.exit(0);
}

sync();
