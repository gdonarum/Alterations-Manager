import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0))
  const endOfDay = new Date(today.setHours(23, 59, 59, 999))

  const [todayAppointments, activeTickets, readyTickets, monthRevenue, totalCustomers] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          startTime: { gte: startOfDay, lte: endOfDay },
          status: 'scheduled',
        },
        include: { customer: true },
        orderBy: { startTime: 'asc' },
      }),
      prisma.ticket.count({
        where: { status: { in: ['received', 'in_progress'] } },
      }),
      prisma.ticket.count({ where: { status: 'ready' } }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
      prisma.customer.count(),
    ])

  return NextResponse.json({
    todayAppointments,
    activeTickets,
    readyTickets,
    monthRevenue: monthRevenue._sum.amount || 0,
    totalCustomers,
  })
}
