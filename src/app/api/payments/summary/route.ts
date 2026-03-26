import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

  const payments = await prisma.payment.findMany({
    where: {
      date: {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31, 23, 59, 59),
      },
    },
  })

  const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
    const monthPayments = payments.filter(p => new Date(p.date).getMonth() === i)
    return {
      month: i + 1,
      total: monthPayments.reduce((sum, p) => sum + p.amount, 0),
      count: monthPayments.length,
      venmo: monthPayments.filter(p => p.method === 'venmo').reduce((sum, p) => sum + p.amount, 0),
      zelle: monthPayments.filter(p => p.method === 'zelle').reduce((sum, p) => sum + p.amount, 0),
      cash: monthPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0),
    }
  })

  const yearTotal = payments.reduce((sum, p) => sum + p.amount, 0)
  const byMethod = {
    venmo: payments.filter(p => p.method === 'venmo').reduce((sum, p) => sum + p.amount, 0),
    zelle: payments.filter(p => p.method === 'zelle').reduce((sum, p) => sum + p.amount, 0),
    cash: payments.filter(p => p.method === 'cash').reduce((sum, p) => sum + p.amount, 0),
  }

  return NextResponse.json({ year, yearTotal, byMethod, monthlyTotals })
}
