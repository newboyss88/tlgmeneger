import { createClient } from '@libsql/client';

const url = 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw';

async function update() {
  const client = createClient({ url, authToken });
  
  console.log('🔄 Turso bazasiga "User.language" ustuni qo\'shilmoqda...');

  try {
    await client.execute(`ALTER TABLE "User" ADD COLUMN "language" TEXT NOT NULL DEFAULT 'uz'`);
    console.log('✅ Ustun muvaffaqiyatli qo\'shildi!');
    process.exit(0);
  } catch (e: any) {
    if (e.message?.includes('duplicate column name')) {
        console.log('⚠️ "language" ustuni allaqachon mavjud.');
        process.exit(0);
    }
    console.error('❌ Xatolik yuz berdi:', e);
    process.exit(1);
  }
}

update();
