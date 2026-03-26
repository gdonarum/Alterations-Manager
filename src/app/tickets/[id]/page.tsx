'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Sparkles, MessageSquare } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

interface Ticket {
  id: string
  ticketNumber: string
  garmentType: string
  description?: string
  alterations: string
  status: string
  dueDate?: string
  price?: number
  notifiedReady: boolean
  createdAt: string
  customer: { id: string; name: string; phone?: string }
}

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [loadingDraft, setLoadingDraft] = useState(false)

  useEffect(() => {
    fetch(`/api/tickets/${id}`).then(r => r.json()).then(setTicket)
  }, [id])

  const updateStatus = async (status: string) => {
    await fetch(`/api/tickets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...ticket, status }),
    })
    setTicket(t => t ? { ...t, status } : t)
  }

  const draftText = async () => {
    if (!ticket) return
    setLoadingDraft(true)
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'draft_message',
        data: {
          customerName: ticket.customer.name,
          jobType: ticket.garmentType,
          ticketNumber: ticket.ticketNumber,
          status: ticket.status,
          phone: ticket.customer.phone,
        },
      }),
    })
    const data = await res.json()
    setDraftMessage(data.message)
    setLoadingDraft(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this ticket?')) return
    await fetch(`/api/tickets/${id}`, { method: 'DELETE' })
    router.push('/tickets')
  }

  if (!ticket) return <div className="p-8 text-gray-500">Loading...</div>

  const statusFlow = ['received', 'in_progress', 'ready', 'picked_up']

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/tickets" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={16} /> Back to Tickets
        </Link>
        <Link href={`/tickets/${id}/print`} className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
          <Printer size={14} /> Print Tag
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-mono text-sm text-purple-600 mb-1">{ticket.ticketNumber}</div>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.garmentType}</h1>
          {ticket.description && <p className="text-gray-500 text-sm mt-1">{ticket.description}</p>}
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Status progression */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <div className="text-xs text-gray-500 mb-3 font-medium">UPDATE STATUS</div>
        <div className="flex items-center gap-2">
          {statusFlow.map((s, i) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-colors ${ticket.status === s ? 'bg-purple-600 text-white' : statusFlow.indexOf(ticket.status) > i ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              {s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</div>
            <Link href={`/customers/${ticket.customer.id}`} className="font-medium text-gray-900 hover:text-purple-600">
              {ticket.customer.name}
            </Link>
            {ticket.customer.phone && <div className="text-sm text-gray-500">{ticket.customer.phone}</div>}
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Created</div>
            <div className="text-sm text-gray-700">{formatDate(ticket.createdAt)}</div>
          </div>
        </div>

        {ticket.dueDate && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Due Date</div>
            <div className="text-sm font-medium text-gray-900">{formatDate(ticket.dueDate)}</div>
          </div>
        )}

        {ticket.price && (
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price</div>
            <div className="text-sm font-bold text-gray-900">{formatCurrency(ticket.price)}</div>
          </div>
        )}

        <div>
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Alterations</div>
          <div className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{ticket.alterations}</div>
        </div>
      </div>

      {/* AI text draft */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <MessageSquare size={16} className="text-purple-600" />
            Draft Customer Message
          </div>
          <button
            onClick={draftText}
            disabled={loadingDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-xs hover:bg-purple-100 disabled:opacity-50"
          >
            <Sparkles size={12} />
            {loadingDraft ? 'Drafting...' : 'AI Draft'}
          </button>
        </div>
        {draftMessage ? (
          <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-800 border border-gray-200">
            {draftMessage}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Click &quot;AI Draft&quot; to generate a message to send this customer about their {ticket.status === 'ready' ? 'ready item' : 'job status'}.</p>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700">Delete ticket</button>
      </div>
    </div>
  )
}
