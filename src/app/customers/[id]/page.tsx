'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Phone, Mail, Ticket, Calendar, DollarSign, Edit2, Check, X } from 'lucide-react'
import { formatDate, formatCurrency, formatTime } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  contactMethod?: string
  notes?: string
  createdAt: string
  appointments: Array<{ id: string; startTime: string; endTime: string; type: string; status: string }>
  tickets: Array<{ id: string; ticketNumber: string; garmentType: string; status: string; price?: number; createdAt: string }>
  payments: Array<{ id: string; amount: number; method: string; date: string; notes?: string }>
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', contactMethod: '', notes: '' })

  useEffect(() => {
    fetch(`/api/customers/${id}`)
      .then(r => r.json())
      .then(data => {
        setCustomer(data)
        setEditForm({ name: data.name, phone: data.phone || '', email: data.email || '', contactMethod: data.contactMethod || 'text', notes: data.notes || '' })
      })
  }, [id])

  const saveEdit = async () => {
    await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    setCustomer(c => c ? { ...c, ...editForm } : c)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this customer and all their data?')) return
    await fetch(`/api/customers/${id}`, { method: 'DELETE' })
    router.push('/customers')
  }

  if (!customer) return <div className="p-8 text-gray-500">Loading...</div>

  const totalSpent = customer.payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/customers" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm">
          <ArrowLeft size={16} /> Back to Customers
        </Link>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <Edit2 size={14} /> Edit
        </button>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-4">
        {editing ? (
          <div className="space-y-3">
            <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} placeholder="Name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={editForm.phone} onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <input value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} placeholder="Notes" rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm"><Check size={14} /> Save</button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"><X size={14} /> Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xl flex-shrink-0">
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{customer.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2">
                {customer.phone && <div className="flex items-center gap-1.5 text-sm text-gray-600"><Phone size={13} /> {customer.phone}</div>}
                {customer.email && <div className="flex items-center gap-1.5 text-sm text-gray-600"><Mail size={13} /> {customer.email}</div>}
              </div>
              {customer.notes && <p className="text-sm text-gray-500 mt-2">{customer.notes}</p>}
              <div className="flex gap-4 mt-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{customer.tickets.length}</div>
                  <div className="text-xs text-gray-500">Tickets</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{formatCurrency(totalSpent)}</div>
                  <div className="text-xs text-gray-500">Total spent</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{customer.appointments.length}</div>
                  <div className="text-xs text-gray-500">Appointments</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex gap-2 mb-4">
        <Link href={`/tickets/new?customerId=${customer.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100">
          <Ticket size={14} /> New Ticket
        </Link>
        <Link href={`/schedule/new?customerId=${customer.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100">
          <Calendar size={14} /> Book Appointment
        </Link>
        <Link href={`/revenue/new?customerId=${customer.id}`} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100">
          <DollarSign size={14} /> Record Payment
        </Link>
      </div>

      {/* Tickets */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Ticket size={16} className="text-gray-400" />
          <h2 className="font-medium text-gray-900">Tickets</h2>
        </div>
        {customer.tickets.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No tickets yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.tickets.map(t => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                <div>
                  <span className="font-mono text-xs text-purple-600 mr-2">{t.ticketNumber}</span>
                  <span className="text-sm text-gray-900">{t.garmentType}</span>
                </div>
                <div className="flex items-center gap-3">
                  {t.price && <span className="text-sm text-gray-600">{formatCurrency(t.price)}</span>}
                  <StatusBadge status={t.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Appointments */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <h2 className="font-medium text-gray-900">Appointments</h2>
        </div>
        {customer.appointments.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No appointments yet</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.appointments.slice(0, 5).map(a => (
              <div key={a.id} className="flex items-center justify-between p-4">
                <div className="text-sm text-gray-700">{formatDate(a.startTime)} at {formatTime(a.startTime)}</div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-gray-200 mb-4">
        <div className="p-4 border-b border-gray-100 flex items-center gap-2">
          <DollarSign size={16} className="text-gray-400" />
          <h2 className="font-medium text-gray-900">Payment History</h2>
        </div>
        {customer.payments.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">No payments recorded</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.payments.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <span className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</span>
                  <span className="text-xs text-gray-400 ml-2 capitalize">via {p.method}</span>
                </div>
                <div className="text-sm text-gray-500">{formatDate(p.date)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button onClick={handleDelete} className="text-sm text-red-500 hover:text-red-700">Delete customer</button>
      </div>
    </div>
  )
}
