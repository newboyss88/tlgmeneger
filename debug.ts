import prisma from './src/lib/prisma';

async function debug() {
  const groups = await prisma.group.findMany();
  console.log("GROUPS:", JSON.stringify(groups, null, 2));

  const bots = await prisma.bot.findMany({ include: { warehouses: { include: { products: true } } }});
  console.log("BOTS & PRODUCTS:", JSON.stringify(bots, null, 2));
}
debug();
