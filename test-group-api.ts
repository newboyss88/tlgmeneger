import prisma from './src/lib/prisma';

async function test() {
  try {
    const groups = await prisma.group.findMany({
      where: { bot: { userId: '6ae0f9e1-9ce0-43ae-bd8f-bb54c9b0c236' } },
      include: { bot: { select: { token: true, name: true, username: true } } },
      orderBy: { createdAt: 'desc' },
    });
    console.log('Prisma Groups Output:', JSON.stringify(groups, null, 2));
  } catch(e: any) {
    console.error('Prisma Error:', e.message);
  }
}

test();
