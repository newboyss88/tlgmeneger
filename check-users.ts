import { createClient } from '@libsql/client';

const remoteDb = createClient({
  url: 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw'
});

async function check() {
  const users = await remoteDb.execute('SELECT id, email, name FROM "User"');
  console.log('Users:', JSON.stringify(users.rows, null, 2));

  const bots = await remoteDb.execute('SELECT id, "userId", name FROM "Bot"');
  console.log('Bots:', JSON.stringify(bots.rows, null, 2));

  process.exit(0);
}

check();
