export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await adminDb.collection('customers').doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [appts, tickets, payments] = await Promise.all([
    adminDb.collection('appointments').where('customerId', '==', id).orderBy('startTime', 'desc').get(),
    adminDb.collection('tickets').where('customerId', '==', id).orderBy('createdAt', 'desc').get(),
    adminDb.collection('payments').where('customerId', '==', id).orderBy('date', 'desc').get(),
  ])

  const toDate = (v: unknown) => v instanceof Timestamp ? v.toDate().toISOString() : v

  return NextResponse.json({
    id: doc.id,
    ...doc.data(),
    appointments: appts.docs.map(d => ({ id: d.id, ...d.data(), startTime: toDate(d.data().startTime), endTime: toDate(d.data().endTime) })),
    tickets: tickets.docs.map(d => ({ id: d.id, ...d.data(), createdAt: toDate(d.data().createdAt), dueDate: toDate(d.data().dueDate) })),
    payments: payments.docs.map(d => ({ id: d.id, ...d.data(), date: toDate(d.data().date) })),
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  await adminDb.collection('customers').doc(id).update({
    name: body.name,
    phone: body.phone || null,
    email: body.email || null,
    contactMethod: body.contactMethod || null,
    notes: body.notes || null,
    updatedAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ id, ...body })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await adminDb.collection('customers').doc(id).delete()
  return NextResponse.json({ success: true })
}
