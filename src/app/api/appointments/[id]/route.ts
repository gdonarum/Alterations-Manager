import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const appointment = await prisma.appointment.update({
    where: { id },
    data: {
      customerId: body.customerId,
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      type: body.type,
      notes: body.notes,
      status: body.status,
    },
    include: { customer: true },
  })
  return NextResponse.json(appointment)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.appointment.update({
    where: { id },
    data: { status: 'cancelled' },
  })
  return NextResponse.json({ success: true })
}
