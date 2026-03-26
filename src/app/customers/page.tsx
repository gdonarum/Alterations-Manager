'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Users, Phone, Mail } from 'lucide-react'

interface Customer {
  id: string
  name: string
  phone?: string
  email?: string
  contactMethod?: string
  notes?: string
  createdAt: string
  _count: { tickets: number; appointments: number; payments: number }
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetchCustomers = (q = '') => {
    setLoading(true)
    fetch(`/api/customers?search=${encodeURIComponent(q)}`)
      .then(r => r.json())
      .then(data => { setCustomers(data); setLoading(false) })
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchCustomers(search)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500 text-sm mt-1">{customers.length} customers</p>
        </div>
        <Link href="/customers/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
          <Plus size={16} /> New Customer
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex items-center gap-2 mb-6 max-w-sm">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <button type="submit" className="px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200">Search</button>
      </form>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Users size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No customers yet</p>
          <Link href="/customers/new" className="mt-3 inline-block text-sm text-purple-600 hover:text-purple-700">
            Add your first customer
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map(c => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-semibold text-sm">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex gap-1">
                  {c._count.tickets > 0 && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{c._count.tickets} tickets</span>
                  )}
                </div>
              </div>
              <div className="font-semibold text-gray-900 mb-1">{c.name}</div>
              {c.phone && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                  <Phone size={12} /> {c.phone}
                </div>
              )}
              {c.email && (
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-1">
                  <Mail size={12} /> {c.email}
                </div>
              )}
              {c.notes && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{c.notes}</p>}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
