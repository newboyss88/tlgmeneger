import { createClient } from '@libsql/client';
import fs from 'fs';

const url = 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io';
const authToken = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw';

async function apply() {
  const client = createClient({ url, authToken });
  const sql = fs.readFileSync('schema.sql', 'utf8');
  
  // Split SQL into parts (very basic split by semicolon, but careful with triggers/etc)
  // Since Prisma SQL is mostly CREATE TABLE/INDEX, this should work.
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Applying ${statements.length} statements...`);

  try {
    // Use batch for efficiency
    await client.batch(statements, "write");
    console.log('✅ Schema applied successfully!');
    process.exit(0);
  } catch (e) {
    console.error('❌ Schema application failed:', e);
    process.exit(1);
  }
}

apply();
