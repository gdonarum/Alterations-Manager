'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Ticket, Users, DollarSign, Clock, ChevronRight } from 'lucide-react'
import { formatCurrency, formatTime } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

interface DashboardData {
  todayAppointments: Array<{
    id: string
    startTime: string
    endTime: string
    type: string
    notes?: string
    customer: { name: string; phone?: string }
  }>
  activeTickets: number
  readyTickets: number
  monthRevenue: number
  totalCustomers: number
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
          </div>
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Today's Appointments", value: data?.todayAppointments.length ?? 0, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50', href: '/schedule' },
    { label: 'Active Tickets', value: data?.activeTickets ?? 0, icon: Ticket, color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/tickets' },
    { label: 'Ready for Pickup', value: data?.readyTickets ?? 0, icon: Ticket, color: 'text-green-600', bg: 'bg-green-50', href: '/tickets?status=ready' },
    { label: 'Revenue This Month', value: formatCurrency(data?.monthRevenue ?? 0), icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50', href: '/revenue' },
  ]

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Good morning!</h1>
        <p className="text-gray-500 mt-1">{today}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`inline-flex p-2.5 rounded-lg ${bg} mb-3`}>
              <Icon className={color} size={20} />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            Today&apos;s Appointments
          </h2>
          <Link href="/schedule" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
            View schedule <ChevronRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {data?.todayAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Calendar size={32} className="mx-auto mb-2 opacity-40" />
              <p>No appointments today</p>
            </div>
          ) : (
            data?.todayAppointments.map(apt => (
              <div key={apt.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="text-sm font-medium text-purple-600 w-24">{formatTime(apt.startTime)}</div>
                  <div>
                    <div className="font-medium text-gray-900">{apt.customer.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{apt.type || 'Fitting'}</div>
                  </div>
                </div>
                <StatusBadge status="scheduled" />
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/tickets/new', label: 'New Ticket', icon: Ticket, desc: 'Start a new job' },
          { href: '/schedule/new', label: 'New Appointment', icon: Calendar, desc: 'Book a fitting' },
          { href: '/customers/new', label: 'New Customer', icon: Users, desc: 'Add a customer' },
        ].map(({ href, label, icon: Icon, desc }) => (
          <Link key={href} href={href} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="bg-purple-50 p-2.5 rounded-lg"><Icon className="text-purple-600" size={20} /></div>
            <div>
              <div className="font-medium text-gray-900">{label}</div>
              <div className="text-xs text-gray-500">{desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
