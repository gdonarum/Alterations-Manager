export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET() {
  const today = new Date()
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const [todayAppts, allTickets, monthPayments, customerCount] = await Promise.all([
    adminDb.collection('appointments')
      .where('startTime', '>=', Timestamp.fromDate(startOfDay))
      .where('startTime', '<=', Timestamp.fromDate(endOfDay))
      .orderBy('startTime', 'asc')
      .get(),
    adminDb.collection('tickets').get(),
    adminDb.collection('payments')
      .where('date', '>=', Timestamp.fromDate(startOfMonth))
      .get(),
    adminDb.collection('customers').count().get(),
  ])

  const tickets = allTickets.docs.map(d => d.data())
  const activeTickets = tickets.filter(t => ['received', 'in_progress'].includes(t.status)).length
  const readyTickets = tickets.filter(t => t.status === 'ready').length
  const monthRevenue = monthPayments.docs.reduce((sum, d) => sum + d.data().amount, 0)

  const todayAppointments = todayAppts.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter((a: Record<string, unknown>) => a.status !== 'cancelled')
    .map((a: Record<string, unknown>) => ({
      ...a,
      startTime: (a.startTime as Timestamp).toDate().toISOString(),
      endTime: (a.endTime as Timestamp).toDate().toISOString(),
    }))

  return NextResponse.json({
    todayAppointments,
    activeTickets,
    readyTickets,
    monthRevenue,
    totalCustomers: customerCount.data().count,
  })
}
