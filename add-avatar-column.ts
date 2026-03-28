import { createClient } from '@libsql/client';

const remoteDb = createClient({
  url: 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw'
});

async function addColumn() {
  try {
    await remoteDb.execute('ALTER TABLE "Group" ADD COLUMN "avatar" TEXT');
    console.log("✅ Group jadvaliga 'avatar' ustuni qo'shildi!");
  } catch (e: any) {
    if (e.message.includes('duplicate column')) {
      console.log("ℹ️ 'avatar' ustuni allaqachon mavjud.");
    } else {
      console.error("❌ Xatolik:", e.message);
    }
  }
  process.exit(0);
}

addColumn();
