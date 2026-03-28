import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  const groups = await prisma.group.findMany()
  const products = await prisma.product.findMany()
  return NextResponse.json({ groups, products })
}
