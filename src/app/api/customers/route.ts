export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'
import { appendCustomerToSheet } from '@/lib/google-sheets'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = (searchParams.get('search') || '').toLowerCase()

  const snapshot = await adminDb.collection('customers').orderBy('name').get()
  let customers = snapshot.docs.map(d => ({ id: d.id, ...d.data() })) as Array<Record<string, unknown> & { id: string; name: string }>

  if (search) {
    customers = customers.filter(c =>
      c.name?.toString().toLowerCase().includes(search) ||
      (c.phone as string)?.includes(search) ||
      (c.email as string)?.toLowerCase().includes(search)
    )
  }

  // Attach ticket/appointment counts
  const [ticketSnap, apptSnap, paySnap] = await Promise.all([
    adminDb.collection('tickets').get(),
    adminDb.collection('appointments').get(),
    adminDb.collection('payments').get(),
  ])

  const ticketCounts: Record<string, number> = {}
  ticketSnap.docs.forEach(d => {
    const cid = d.data().customerId
    ticketCounts[cid] = (ticketCounts[cid] || 0) + 1
  })
  const apptCounts: Record<string, number> = {}
  apptSnap.docs.forEach(d => {
    const cid = d.data().customerId
    apptCounts[cid] = (apptCounts[cid] || 0) + 1
  })
  const payCounts: Record<string, number> = {}
  paySnap.docs.forEach(d => {
    const cid = d.data().customerId
    payCounts[cid] = (payCounts[cid] || 0) + 1
  })

  const result = customers.map(c => ({
    ...c,
    _count: { tickets: ticketCounts[c.id] || 0, appointments: apptCounts[c.id] || 0, payments: payCounts[c.id] || 0 },
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const now = FieldValue.serverTimestamp()

  const docRef = await adminDb.collection('customers').add({
    name: body.name,
    phone: body.phone || null,
    email: body.email || null,
    contactMethod: body.contactMethod || null,
    notes: body.notes || null,
    createdAt: now,
    updatedAt: now,
  })

  // Sync to Google Sheets if access token available
  const session = await getSession()
  if (session?.googleAccessToken) {
    await appendCustomerToSheet(session.googleAccessToken, body)
  }

  return NextResponse.json({ id: docRef.id, ...body }, { status: 201 })
}
