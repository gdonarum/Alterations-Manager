'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewCustomerPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    contactMethod: 'text',
    notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    const res = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    if (res.ok) {
      const customer = await res.json()
      router.push(`/customers/${customer.id}`)
    } else {
      setError('Failed to save customer')
      setSaving(false)
    }
  }

  return (
    <div className="p-8 max-w-xl">
      <div className="mb-6">
        <Link href="/customers" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Customer</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Jane Smith"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="(555) 123-4567"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="jane@example.com"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How they contact you</label>
          <div className="flex gap-2">
            {['text', 'facebook', 'both'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setForm(f => ({ ...f, contactMethod: m }))}
                className={`px-3 py-2 text-sm rounded-lg border capitalize transition-colors ${form.contactMethod === m ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
              >
                {m === 'both' ? 'Text & FB' : m === 'facebook' ? 'Facebook' : 'Text'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="Any notes about this customer..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
          >
            {saving ? 'Saving...' : 'Save Customer'}
          </button>
          <Link href="/customers" className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
