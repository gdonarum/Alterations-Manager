export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { createCalendarEvent } from '@/lib/google-calendar'
import { getSession } from '@/lib/session'

function toISO(v: unknown) {
  return v instanceof Timestamp ? v.toDate().toISOString() : v
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  let query = adminDb.collection('appointments').orderBy('startTime', 'asc') as FirebaseFirestore.Query

  if (from && to) {
    query = query
      .where('startTime', '>=', Timestamp.fromDate(new Date(from)))
      .where('startTime', '<=', Timestamp.fromDate(new Date(to)))
  }

  const snapshot = await query.get()
  const appointments = snapshot.docs
    .map(d => ({ id: d.id, ...d.data(), startTime: toISO(d.data().startTime), endTime: toISO(d.data().endTime) }))
    .filter((a: Record<string, unknown>) => a.status !== 'cancelled')

  return NextResponse.json(appointments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Fetch customer name for denormalization
  const customerDoc = await adminDb.collection('customers').doc(body.customerId).get()
  const customer = customerDoc.data()

  const startTime = new Date(body.startTime)
  const endTime = new Date(body.endTime)

  const data = {
    customerId: body.customerId,
    customerName: customer?.name || '',
    customerPhone: customer?.phone || null,
    startTime: Timestamp.fromDate(startTime),
    endTime: Timestamp.fromDate(endTime),
    type: body.type || 'fitting',
    notes: body.notes || null,
    status: 'scheduled',
    googleEventId: null as string | null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }

  // Sync to Google Calendar
  const session = await getSession()
  if (session?.googleAccessToken) {
    const eventId = await createCalendarEvent(session.googleAccessToken, {
      customerName: customer?.name || body.customerId,
      type: body.type || 'fitting',
      notes: body.notes,
      startTime,
      endTime,
    })
    if (eventId) data.googleEventId = eventId
  }

  const docRef = await adminDb.collection('appointments').add(data)

  return NextResponse.json({
    id: docRef.id,
    ...body,
    customerName: customer?.name || '',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    status: 'scheduled',
  }, { status: 201 })
}
