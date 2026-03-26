import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  let dateFilter = {}
  if (year) {
    const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1)
    const endDate = month
      ? new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      : new Date(parseInt(year), 12, 0, 23, 59, 59)
    dateFilter = { date: { gte: startDate, lte: endDate } }
  }

  const payments = await prisma.payment.findMany({
    where: dateFilter,
    include: { customer: true, tickets: true },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const payment = await prisma.payment.create({
    data: {
      customerId: body.customerId,
      amount: parseFloat(body.amount),
      method: body.method,
      date: body.date ? new Date(body.date) : new Date(),
      notes: body.notes || null,
    },
    include: { customer: true },
  })

  if (body.ticketIds && body.ticketIds.length > 0) {
    await prisma.ticket.updateMany({
      where: { id: { in: body.ticketIds } },
      data: { paymentId: payment.id },
    })
  }

  return NextResponse.json(payment, { status: 201 })
}
