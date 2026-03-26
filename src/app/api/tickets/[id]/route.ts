export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

function toISO(v: unknown) {
  return v instanceof Timestamp ? v.toDate().toISOString() : v
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await adminDb.collection('tickets').doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const data = doc.data()!
  const customerDoc = await adminDb.collection('customers').doc(data.customerId).get()

  return NextResponse.json({
    id: doc.id,
    ...data,
    createdAt: toISO(data.createdAt),
    dueDate: toISO(data.dueDate),
    customer: { id: data.customerId, name: data.customerName, phone: data.customerPhone },
    ...(customerDoc.exists ? { customer: { id: customerDoc.id, ...customerDoc.data() } } : {}),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
  if (body.status !== undefined) updates.status = body.status
  if (body.garmentType !== undefined) updates.garmentType = body.garmentType
  if (body.description !== undefined) updates.description = body.description
  if (body.alterations !== undefined) updates.alterations = body.alterations
  if (body.dueDate !== undefined) updates.dueDate = body.dueDate ? Timestamp.fromDate(new Date(body.dueDate)) : null
  if (body.price !== undefined) updates.price = body.price ? parseFloat(body.price) : null
  if (body.notifiedReady !== undefined) updates.notifiedReady = body.notifiedReady
  if (body.paymentId !== undefined) updates.paymentId = body.paymentId

  await adminDb.collection('tickets').doc(id).update(updates)
  const updated = await adminDb.collection('tickets').doc(id).get()

  return NextResponse.json({ id, ...updated.data(), dueDate: toISO(updated.data()?.dueDate) })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await adminDb.collection('tickets').doc(id).delete()
  return NextResponse.json({ success: true })
}
