'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Ticket, Printer } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import { Suspense } from 'react'

interface TicketItem {
  id: string
  ticketNumber: string
  garmentType: string
  description?: string
  alterations: string
  status: string
  dueDate?: string
  price?: number
  notifiedReady: boolean
  customer: { id: string; name: string; phone?: string }
}

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'received', label: 'Received' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'ready', label: 'Ready' },
  { value: 'picked_up', label: 'Picked Up' },
]

function TicketsContent() {
  const searchParams = useSearchParams()
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')

  const fetchTickets = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    setLoading(true)
    fetch(`/api/tickets?${params}`)
      .then(r => r.json())
      .then(data => { setTickets(data); setLoading(false) })
  }

  useEffect(fetchTickets, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTickets()
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchTickets()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <Link href="/tickets/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
          <Plus size={16} /> New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tickets, customers..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Search</button>
        </form>

        <div className="flex gap-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${statusFilter === f.value ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Ticket size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No tickets found</p>
          <Link href="/tickets/new" className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-700">
            Create the first ticket
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Ticket #</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Customer</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Garment</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Alterations</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Due</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Price</th>
                <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-gray-500 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${ticket.id}`} className="text-sm font-mono text-purple-600 hover:text-purple-800">
                      {ticket.ticketNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{ticket.customer.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {ticket.garmentType}
                    {ticket.description && <span className="text-gray-400 ml-1">({ticket.description})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{ticket.alterations}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{ticket.dueDate ? formatDate(ticket.dueDate) : '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{ticket.price ? formatCurrency(ticket.price) : '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={ticket.status}
                      onChange={e => handleStatusUpdate(ticket.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1"
                    >
                      <option value="received">Received</option>
                      <option value="in_progress">In Progress</option>
                      <option value="ready">Ready</option>
                      <option value="picked_up">Picked Up</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/tickets/${ticket.id}/print`} className="text-gray-400 hover:text-gray-600 p-1 inline-block" title="Print tag">
                      <Printer size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function TicketsPage() {
  return (
    <Suspense>
      <TicketsContent />
    </Suspense>
  )
}
