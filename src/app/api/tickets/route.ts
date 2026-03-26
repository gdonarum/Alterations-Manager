export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { generateTicketNumber } from '@/lib/utils'

function toISO(v: unknown) {
  return v instanceof Timestamp ? v.toDate().toISOString() : v
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const search = (searchParams.get('search') || '').toLowerCase()

  let query = adminDb.collection('tickets').orderBy('createdAt', 'desc') as FirebaseFirestore.Query
  if (status) query = query.where('status', '==', status)

  const snapshot = await query.get()
  let tickets = snapshot.docs.map(d => ({
    id: d.id, ...d.data(),
    createdAt: toISO(d.data().createdAt),
    dueDate: toISO(d.data().dueDate),
  })) as Array<Record<string, unknown>>

  if (search) {
    tickets = tickets.filter(t =>
      (t.ticketNumber as string)?.toLowerCase().includes(search) ||
      (t.garmentType as string)?.toLowerCase().includes(search) ||
      (t.description as string)?.toLowerCase().includes(search) ||
      (t.customerName as string)?.toLowerCase().includes(search)
    )
  }

  return NextResponse.json(tickets)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const customerDoc = await adminDb.collection('customers').doc(body.customerId).get()
  const customer = customerDoc.data()

  const now = FieldValue.serverTimestamp()
  const docRef = await adminDb.collection('tickets').add({
    ticketNumber: generateTicketNumber(),
    customerId: body.customerId,
    customerName: customer?.name || '',
    customerPhone: customer?.phone || null,
    garmentType: body.garmentType,
    description: body.description || null,
    alterations: body.alterations,
    status: 'received',
    dueDate: body.dueDate ? Timestamp.fromDate(new Date(body.dueDate)) : null,
    notifiedReady: false,
    price: body.price ? parseFloat(body.price) : null,
    paymentId: null,
    createdAt: now,
    updatedAt: now,
  })

  const created = await docRef.get()
  return NextResponse.json({
    id: docRef.id,
    ...created.data(),
    customer: { id: body.customerId, name: customer?.name || '', phone: customer?.phone || null },
  }, { status: 201 })
}
