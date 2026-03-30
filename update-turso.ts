import { createClient } from '@libsql/client';

const url = 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw';

async function update() {
  const client = createClient({ url, authToken });
  
  const sql = `
    CREATE TABLE IF NOT EXISTS "TwoFactorCode" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "code" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "expiresAt" DATETIME NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "TwoFactorCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
    CREATE INDEX IF NOT EXISTS "TwoFactorCode_userId_idx" ON "TwoFactorCode" ("userId");
  `;

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log('🔄 Turso bazasiga "TwoFactorCode" jadvali qo\'shilmoqda...');

  try {
    for (const statement of statements) {
      await client.execute(statement);
    }
    console.log('✅ Jadval muvaffaqiyatli yaratildi!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Xatolik yuz berdi:', e);
    process.exit(1);
  }
}

update();
