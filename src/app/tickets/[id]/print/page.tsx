'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Printer, Scissors } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'

interface Ticket {
  id: string
  ticketNumber: string
  garmentType: string
  description?: string
  alterations: string
  status: string
  dueDate?: string
  price?: number
  createdAt: string
  customer: { name: string; phone?: string }
}

export default function PrintTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    fetch(`/api/tickets/${id}`).then(r => r.json()).then(setTicket)
  }, [id])

  if (!ticket) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Link href="/tickets" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={16} /> Back to Tickets
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
        >
          <Printer size={16} /> Print Tag
        </button>
      </div>

      {/* Printable garment tag */}
      <div className="max-w-2xl">
        <h2 className="text-lg font-semibold text-gray-700 mb-4 print:hidden">Garment Tag Preview</h2>

        {/* The garment tag - will print */}
        <div className="border-2 border-dashed border-gray-400 rounded-xl p-6 bg-white print:border-2 print:border-gray-700">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-300 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Scissors size={20} className="text-purple-600" />
              <div>
                <div className="font-bold text-lg text-gray-900">Alterations</div>
                <div className="text-xs text-gray-500">Professional Alterations Service</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-purple-700">{ticket.ticketNumber}</div>
              <div className="text-xs text-gray-500">Ticket Number</div>
            </div>
          </div>

          {/* Customer info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Customer</div>
              <div className="font-semibold text-gray-900">{ticket.customer.name}</div>
              {ticket.customer.phone && <div className="text-sm text-gray-600">{ticket.customer.phone}</div>}
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Date In</div>
              <div className="text-sm text-gray-900">{formatDateTime(ticket.createdAt)}</div>
              {ticket.dueDate && (
                <>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-1 mt-2">Due Date</div>
                  <div className="text-sm font-medium text-gray-900">{formatDate(ticket.dueDate)}</div>
                </>
              )}
            </div>
          </div>

          {/* Garment */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Garment</div>
            <div className="font-semibold text-gray-900">{ticket.garmentType}</div>
            {ticket.description && <div className="text-sm text-gray-600">{ticket.description}</div>}
          </div>

          {/* Alterations */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Alterations / Instructions</div>
            <div className="text-sm text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-3 border border-gray-200">
              {ticket.alterations}
            </div>
          </div>

          {/* Price */}
          {ticket.price && (
            <div className="mb-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Price</div>
              <div className="font-bold text-gray-900 text-lg">${ticket.price.toFixed(2)}</div>
            </div>
          )}

          {/* Tear-off claim ticket */}
          <div className="border-t-2 border-dashed border-gray-400 pt-4 mt-4">
            <p className="text-xs text-gray-500 text-center mb-3 print:hidden">— Tear here — Customer claim ticket —</p>
            <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div>
                <div className="text-xs text-gray-500">CLAIM TICKET</div>
                <div className="font-mono font-bold text-purple-700 text-xl">{ticket.ticketNumber}</div>
                <div className="text-sm text-gray-700">{ticket.customer.name}</div>
                <div className="text-xs text-gray-500">{ticket.garmentType}</div>
              </div>
              <div className="text-right">
                {ticket.dueDate && (
                  <div>
                    <div className="text-xs text-gray-500">Ready by</div>
                    <div className="text-sm font-medium text-gray-900">{formatDate(ticket.dueDate)}</div>
                  </div>
                )}
                {ticket.price && (
                  <div className="mt-1">
                    <div className="font-bold text-gray-900">${ticket.price.toFixed(2)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 flex gap-3 print:hidden">
          <Link href={`/tickets/${ticket.id}`} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            View Ticket Details
          </Link>
          <Link href="/tickets/new" className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700">
            Create Another Ticket
          </Link>
        </div>
      </div>
    </div>
  )
}
