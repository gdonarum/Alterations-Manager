export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { appendPaymentToSheet } from '@/lib/google-sheets'
import { getSession } from '@/lib/session'

function toISO(v: unknown) {
  return v instanceof Timestamp ? v.toDate().toISOString() : v
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year')
  const month = searchParams.get('month')

  let query = adminDb.collection('payments').orderBy('date', 'desc') as FirebaseFirestore.Query

  if (year) {
    const startDate = new Date(parseInt(year), month ? parseInt(month) - 1 : 0, 1)
    const endDate = month
      ? new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)
      : new Date(parseInt(year), 11, 31, 23, 59, 59)
    query = query
      .where('date', '>=', Timestamp.fromDate(startDate))
      .where('date', '<=', Timestamp.fromDate(endDate))
  }

  const snapshot = await query.get()
  const payments = snapshot.docs.map(d => ({
    id: d.id, ...d.data(), date: toISO(d.data().date),
  }))

  return NextResponse.json(payments)
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  const customerDoc = await adminDb.collection('customers').doc(body.customerId).get()
  const customer = customerDoc.data()

  const paymentDate = body.date ? new Date(body.date) : new Date()

  const docRef = await adminDb.collection('payments').add({
    customerId: body.customerId,
    customerName: customer?.name || '',
    amount: parseFloat(body.amount),
    method: body.method,
    date: Timestamp.fromDate(paymentDate),
    notes: body.notes || null,
    ticketIds: body.ticketIds || [],
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Link tickets to payment
  if (body.ticketIds?.length > 0) {
    const batch = adminDb.batch()
    body.ticketIds.forEach((tid: string) => {
      batch.update(adminDb.collection('tickets').doc(tid), { paymentId: docRef.id })
    })
    await batch.commit()
  }

  // Fetch ticket numbers for sheet sync
  let ticketNumbers: string[] = []
  if (body.ticketIds?.length > 0) {
    const ticketDocs = await Promise.all(body.ticketIds.map((tid: string) => adminDb.collection('tickets').doc(tid).get()))
    ticketNumbers = ticketDocs.map(d => d.data()?.ticketNumber || '').filter(Boolean)
  }

  // Sync to Google Sheets
  const session = await getSession()
  if (session?.googleAccessToken) {
    await appendPaymentToSheet(session.googleAccessToken, {
      date: paymentDate,
      customerName: customer?.name || '',
      amount: parseFloat(body.amount),
      method: body.method,
      ticketNumbers,
      notes: body.notes,
    })
  }

  return NextResponse.json({ id: docRef.id, ...body, date: paymentDate.toISOString() }, { status: 201 })
}
