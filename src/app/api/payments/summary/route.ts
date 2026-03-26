export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  const snapshot = await adminDb.collection('payments')
    .where('date', '>=', Timestamp.fromDate(new Date(year, 0, 1)))
    .where('date', '<=', Timestamp.fromDate(new Date(year, 11, 31, 23, 59, 59)))
    .get()

  const payments = snapshot.docs.map(d => {
    const data = d.data()
    return {
      amount: data.amount as number,
      method: data.method as string,
      date: (data.date as Timestamp).toDate(),
    }
  })

  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const mp = payments.filter(p => p.date.getMonth() === i)
    return {
      month: i + 1,
      total: mp.reduce((s, p) => s + p.amount, 0),
      count: mp.length,
      venmo: mp.filter(p => p.method === 'venmo').reduce((s, p) => s + p.amount, 0),
      zelle: mp.filter(p => p.method === 'zelle').reduce((s, p) => s + p.amount, 0),
      cash: mp.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0),
    }
  })

  return NextResponse.json({
    year,
    yearTotal: payments.reduce((s, p) => s + p.amount, 0),
    byMethod: {
      venmo: payments.filter(p => p.method === 'venmo').reduce((s, p) => s + p.amount, 0),
      zelle: payments.filter(p => p.method === 'zelle').reduce((s, p) => s + p.amount, 0),
      cash: payments.filter(p => p.method === 'cash').reduce((s, p) => s + p.amount, 0),
    },
    monthlyTotals,
  })
}
