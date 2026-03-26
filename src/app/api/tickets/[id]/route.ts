import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const ticket = await prisma.ticket.findUnique({ where: { id }, include: { customer: true, payment: true } })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(ticket)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      garmentType: body.garmentType,
      description: body.description ?? undefined,
      alterations: body.alterations,
      status: body.status,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
      price: body.price !== undefined ? parseFloat(body.price) : undefined,
      notifiedReady: body.notifiedReady ?? undefined,
      paymentId: body.paymentId ?? undefined,
    },
    include: { customer: true, payment: true },
  })
  return NextResponse.json(ticket)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.ticket.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
