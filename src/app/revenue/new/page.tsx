'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Suspense } from 'react'

interface Customer {
  id: string
  name: string
  phone?: string
}

interface Ticket {
  id: string
  ticketNumber: string
  garmentType: string
  price?: number
  status: string
  customerId: string
}

function NewPaymentContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [form, setForm] = useState({
    customerId: searchParams.get('customerId') || '',
    amount: '',
    method: 'cash',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    ticketIds: [] as string[],
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  useEffect(() => {
    if (form.customerId) {
      fetch(`/api/tickets?status=ready`)
        .then(r => r.json())
        .then((data: Ticket[]) => setTickets(data.filter(t => t.customerId === form.customerId)))
    }
  }, [form.customerId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      router.push('/revenue')
    } else {
      setSaving(false)
    }
  }

  const toggleTicket = (id: string) => {
    setForm(f => ({
      ...f,
      ticketIds: f.ticketIds.includes(id) ? f.ticketIds.filter(t => t !== id) : [...f.ticketIds, id],
    }))
  }

  // Auto-sum ticket prices
  const selectedTotal = tickets
    .filter(t => form.ticketIds.includes(t.id))
    .reduce((sum, t) => sum + (t.price || 0), 0)

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/revenue" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Revenue
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <select
            required
            value={form.customerId}
            onChange={e => setForm(f => ({ ...f, customerId: e.target.value, ticketIds: [] }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a customer...</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {tickets.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Link to Tickets (optional)</label>
            <div className="space-y-2">
              {tickets.map(t => (
                <label key={t.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={form.ticketIds.includes(t.id)}
                    onChange={() => toggleTicket(t.id)}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <span className="font-mono text-xs text-purple-600">{t.ticketNumber}</span>
                    <span className="text-sm text-gray-700 ml-2">{t.garmentType}</span>
                  </div>
                  {t.price && <span className="text-sm text-gray-600">${t.price.toFixed(2)}</span>}
                </label>
              ))}
            </div>
            {selectedTotal > 0 && (
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, amount: selectedTotal.toFixed(2) }))}
                className="mt-2 text-xs text-purple-600 hover:text-purple-700"
              >
                Auto-fill amount: ${selectedTotal.toFixed(2)}
              </button>
            )}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <input
              type="number"
              step="0.01"
              required
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
          <div className="flex gap-2">
            {['venmo', 'zelle', 'cash'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setForm(f => ({ ...f, method: m }))}
                className={`flex-1 py-2 text-sm rounded-lg border capitalize transition-colors ${form.method === m ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
          <input
            type="date"
            required
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <input
            type="text"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Optional notes..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium">
            {saving ? 'Saving...' : 'Record Payment'}
          </button>
          <Link href="/revenue" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancel</Link>
        </div>
      </form>
    </div>
  )
}

export default function NewPaymentPage() {
  return <Suspense><NewPaymentContent /></Suspense>
}
