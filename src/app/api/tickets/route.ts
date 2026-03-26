import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateTicketNumber } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = searchParams.get('search') || ''

  const tickets = await prisma.ticket.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(search ? { OR: [{ ticketNumber: { contains: search } }, { garmentType: { contains: search } }, { description: { contains: search } }, { customer: { name: { contains: search } } }] } : {}),
    },
    include: { customer: true, payment: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const ticket = await prisma.ticket.create({
    data: {
      ticketNumber: generateTicketNumber(),
      customerId: body.customerId,
      garmentType: body.garmentType,
      description: body.description || null,
      alterations: body.alterations,
      status: 'received',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      price: body.price ? parseFloat(body.price) : null,
    },
    include: { customer: true },
  })
  return NextResponse.json(ticket, { status: 201 })
}
