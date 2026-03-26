'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Download, DollarSign, TrendingUp } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface MonthlySummary {
  month: number
  total: number
  count: number
  venmo: number
  zelle: number
  cash: number
}

interface Summary {
  year: number
  yearTotal: number
  byMethod: { venmo: number; zelle: number; cash: number }
  monthlyTotals: MonthlySummary[]
}

interface Payment {
  id: string
  amount: number
  method: string
  date: string
  notes?: string
  customerId: string
  customerName: string
  ticketIds: string[]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function RevenuePage() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [summary, setSummary] = useState<Summary | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/payments/summary?year=${year}`).then(r => r.json()),
      fetch(`/api/payments?year=${year}`).then(r => r.json()),
    ]).then(([s, p]) => {
      setSummary(s)
      setPayments(p)
      setLoading(false)
    })
  }, [year])

  const exportCSV = () => {
    const headers = ['Date', 'Customer', 'Amount', 'Method', 'Notes']
    const rows = payments.map(p => [
      formatDate(p.date),
      p.customerName,
      p.amount.toFixed(2),
      p.method,
      p.notes || '',
    ])
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alterations-revenue-${year}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const maxMonth = summary ? Math.max(...summary.monthlyTotals.map(m => m.total), 1) : 1

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue</h1>
          <p className="text-gray-500 text-sm mt-1">Track income for taxes and records</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
            <Download size={14} /> Export CSV
          </button>
          <Link href="/revenue/new" className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium">
            <Plus size={16} /> Record Payment
          </Link>
        </div>
      </div>

      {/* Year selector */}
      <div className="flex items-center gap-2 mb-6">
        {[currentYear - 1, currentYear, currentYear + 1].map(y => (
          <button
            key={y}
            onClick={() => setYear(y)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${year === y ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {y}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}</div>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-purple-600" />
                <span className="text-xs text-gray-500">Year Total</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.yearTotal || 0)}</div>
            </div>
            {(['venmo', 'zelle', 'cash'] as const).map(method => (
              <div key={method} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
                <div className="text-xs text-gray-500 capitalize mb-2">{method}</div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary?.byMethod[method] || 0)}</div>
              </div>
            ))}
          </div>

          {/* Monthly bar chart */}
          <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-6">
            <h2 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign size={16} className="text-gray-400" />
              Monthly Revenue — {year}
            </h2>
            <div className="flex items-end gap-1 h-32">
              {summary?.monthlyTotals.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-xs text-gray-500">{m.total > 0 ? formatCurrency(m.total).replace('$', '') : ''}</div>
                  <div
                    className="w-full bg-purple-400 rounded-t transition-all"
                    style={{ height: `${(m.total / maxMonth) * 80}px`, minHeight: m.total > 0 ? '4px' : '0' }}
                    title={`${MONTH_NAMES[m.month - 1]}: ${formatCurrency(m.total)}`}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-1 mt-1">
              {MONTH_NAMES.map(m => (
                <div key={m} className="flex-1 text-center text-xs text-gray-400">{m}</div>
              ))}
            </div>
          </div>

          {/* Payments table */}
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-medium text-gray-900">Payment History — {year}</h2>
            </div>
            {payments.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No payments recorded for {year}</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Date</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Customer</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Amount</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Method</th>
                    <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.date)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/customers/${p.customerId}`} className="text-sm text-gray-900 hover:text-purple-600">
                          {p.customerName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${p.method === 'venmo' ? 'bg-blue-100 text-blue-700' : p.method === 'zelle' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                          {p.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t border-gray-200">
                    <td colSpan={2} className="px-4 py-3 text-sm font-medium text-gray-700">Total</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{formatCurrency(payments.reduce((s, p) => s + p.amount, 0))}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
