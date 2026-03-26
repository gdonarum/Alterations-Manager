import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const appointments = await prisma.appointment.findMany({
    where: {
      ...(from && to
        ? {
            startTime: {
              gte: new Date(from),
              lte: new Date(to),
            },
          }
        : {}),
      status: { not: 'cancelled' },
    },
    include: { customer: true },
    orderBy: { startTime: 'asc' },
  })

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const appointment = await prisma.appointment.create({
    data: {
      customerId: body.customerId,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      type: body.type || 'fitting',
      notes: body.notes || null,
      status: 'scheduled',
    },
    include: { customer: true },
  })
  return NextResponse.json(appointment, { status: 201 })
}
