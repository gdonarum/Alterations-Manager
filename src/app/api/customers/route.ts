import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''

  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search } },
            { phone: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : undefined,
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { tickets: true, appointments: true, payments: true } },
    },
  })

  return NextResponse.json(customers)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const customer = await prisma.customer.create({
    data: {
      name: body.name,
      phone: body.phone || null,
      email: body.email || null,
      contactMethod: body.contactMethod || null,
      notes: body.notes || null,
    },
  })
  return NextResponse.json(customer, { status: 201 })
}
