import { createClient } from '@libsql/client';

const localDb = createClient({ url: 'file:prisma/dev.db' });
const remoteDb = createClient({
  url: 'libsql://tgmanager-newboyss.aws-eu-west-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzQ2Nzc1NzEsImlkIjoiMDE5ZDMzMDMtMTAwMS03Y2I2LTlmMWMtZDZhZWM3OGQ5MmJkIiwicmlkIjoiOTIzYmU4NWQtN2M3NS00Yjc3LWE3ZmItNjkwMGEwNWFjYzdiIn0.I1qPFhnxTqAgxgOE9fqoa9ABlMdS2IQ5Smj4wY8gZk5G37-t2DqyCVCnMgVxdM_gizH3nm74qr6Yibzb0YGDDw'
});

async function check() {
  const localGroups = await localDb.execute('SELECT * FROM "Group"');
  console.log('Local Groups:', JSON.stringify(localGroups.rows, null, 2));

  const remoteGroups = await remoteDb.execute('SELECT * FROM "Group"');
  console.log('Remote Groups:', JSON.stringify(remoteGroups.rows, null, 2));

  process.exit(0);
}

check();
