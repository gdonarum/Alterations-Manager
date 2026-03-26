'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { GARMENT_TYPES, ALTERATION_TYPES } from '@/lib/utils'

interface Customer {
  id: string
  name: string
  phone?: string
}

export default function NewTicketPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [form, setForm] = useState({
    customerId: '',
    garmentType: '',
    description: '',
    alterations: '',
    dueDate: '',
    price: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedAlts, setSelectedAlts] = useState<string[]>([])

  useEffect(() => {
    fetch('/api/customers').then(r => r.json()).then(setCustomers)
  }, [])

  useEffect(() => {
    setForm(f => ({ ...f, alterations: selectedAlts.join(', ') }))
  }, [selectedAlts])

  const toggleAlt = (alt: string) => {
    setSelectedAlts(prev => prev.includes(alt) ? prev.filter(a => a !== alt) : [...prev, alt])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.customerId) { setError('Please select a customer'); return }
    if (!form.garmentType) { setError('Please select a garment type'); return }
    if (!form.alterations.trim()) { setError('Please describe the alterations needed'); return }
    setSaving(true)
    setError('')

    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (res.ok) {
      const ticket = await res.json()
      router.push(`/tickets/${ticket.id}/print`)
    } else {
      setError('Failed to create ticket')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/tickets" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Tickets
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Ticket</h1>
        <p className="text-gray-500 text-sm mt-1">Record a new alteration job</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
          <select
            value={form.customerId}
            onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Select a customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}{c.phone ? ` (${c.phone})` : ''}</option>
            ))}
          </select>
          <Link href="/customers/new" className="text-xs text-purple-600 hover:text-purple-700 mt-1 block">
            + Add new customer
          </Link>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Garment Type *</label>
          <div className="flex flex-wrap gap-2">
            {GARMENT_TYPES.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setForm(f => ({ ...f, garmentType: g }))}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${form.garmentType === g ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (color, brand, etc.)</label>
          <input
            type="text"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="e.g., Navy blue blazer, size 8"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Alterations Needed *</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {ALTERATION_TYPES.map(alt => (
              <button
                key={alt}
                type="button"
                onClick={() => toggleAlt(alt)}
                className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${selectedAlts.includes(alt) ? 'bg-blue-50 text-blue-700 border-blue-300' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {alt}
              </button>
            ))}
          </div>
          <textarea
            value={form.alterations}
            onChange={e => setForm(f => ({ ...f, alterations: e.target.value }))}
            rows={3}
            placeholder="Detailed alteration instructions..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0.00"
                className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Creating...' : 'Create Ticket & Print Tag'}
          </button>
          <Link href="/tickets" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
