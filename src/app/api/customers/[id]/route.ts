import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      appointments: { orderBy: { startTime: 'desc' } },
      tickets: { orderBy: { createdAt: 'desc' } },
      payments: { orderBy: { date: 'desc' } },
    },
  })
  if (!customer) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(customer)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  const customer = await prisma.customer.update({
    where: { id },
    data: { name: body.name, phone: body.phone || null, email: body.email || null, contactMethod: body.contactMethod || null, notes: body.notes || null },
  })
  return NextResponse.json(customer)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await prisma.customer.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
