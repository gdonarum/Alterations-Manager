'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight, Sparkles, Calendar } from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  type: string
  notes?: string
  status: string
  customerName: string
  customerId: string
  customerPhone?: string
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 9)

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [aiSlots, setAiSlots] = useState<Array<{ start: string; end: string; label: string }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Week bounds for desktop grid
  const startOfWeek = new Date(currentDate)
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    return d
  })

  useEffect(() => {
    const from = days[0].toISOString()
    const to = days[6].toISOString()
    setLoading(true)
    fetch(`/api/appointments?from=${from}&to=${to}`)
      .then(r => r.json())
      .then(data => { setAppointments(data); setLoading(false) })
  }, [currentDate]) // eslint-disable-line react-hooks/exhaustive-deps

  const dayAppointments = appointments.filter(apt =>
    new Date(apt.startTime).toDateString() === currentDate.toDateString()
  )

  const getTopPercent = (time: string) => {
    const d = new Date(time)
    return ((d.getHours() - 9) * 60 + d.getMinutes()) / (12 * 60) * 100
  }

  const getHeightPercent = (start: string, end: string) => {
    const mins = (new Date(end).getTime() - new Date(start).getTime()) / 60000
    return (mins / (12 * 60)) * 100
  }

  const fetchAiSlots = async () => {
    setLoadingSlots(true)
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'scheduling_suggestion',
        data: {
          date: currentDate.toDateString(),
          existingAppointments: dayAppointments.map(a => ({
            start: formatTime(a.startTime),
            end: formatTime(a.endTime),
            customer: a.customerName,
          })),
        },
      }),
    })
    const data = await res.json()
    setAiSlots(data.slots || [])
    setLoadingSlots(false)
  }

  const handleStatusChange = async (id: string, status: string) => {
    await fetch(`/api/appointments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString()

  const prevDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() - 1); return n })
  const nextDay = () => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() + 1); return n })
  const prevWeek = () => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n })
  const nextWeek = () => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n })

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 text-xs mt-0.5">9am – 9pm</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAiSlots} disabled={loadingSlots} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50">
            <Sparkles size={12} /> {loadingSlots ? '...' : 'Suggest'}
          </button>
          <Link href="/schedule/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700">
            <Plus size={14} /> New
          </Link>
        </div>
      </div>

      {aiSlots.length > 0 && (
        <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-xs font-medium text-purple-800 mb-2 flex items-center gap-1"><Sparkles size={12} /> Open slots today</p>
          <div className="flex gap-2 flex-wrap">
            {aiSlots.map((slot, i) => (
              <span key={i} className="px-2.5 py-1 bg-white text-purple-700 rounded-lg text-xs border border-purple-200">
                {slot.start}–{slot.end} <span className="text-purple-400">({slot.label})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── MOBILE: Day view ──────────────────────────────── */}
      <div className="block md:hidden">
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevDay} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <div className="text-center">
            <div className={`text-base font-semibold ${isToday(currentDate) ? 'text-purple-600' : 'text-gray-900'}`}>
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            {isToday(currentDate) && <div className="text-xs text-purple-500">Today</div>}
          </div>
          <button onClick={nextDay} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6 text-center text-gray-400 text-sm">Loading...</div>
          ) : dayAppointments.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <Calendar size={28} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm">No appointments</p>
              <Link href="/schedule/new" className="mt-2 inline-block text-xs text-purple-600">+ Add one</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {dayAppointments.map(apt => (
                <div key={apt.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="text-sm font-semibold text-gray-900">{apt.customerName}</div>
                      <div className="text-xs text-purple-600 mt-0.5">
                        {formatTime(apt.startTime)} – {formatTime(apt.endTime)}
                      </div>
                      <div className="text-xs text-gray-500 capitalize mt-0.5">{apt.type || 'Fitting'}</div>
                      {apt.notes && <div className="text-xs text-gray-400 mt-1">{apt.notes}</div>}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <StatusBadge status={apt.status} />
                      <select
                        value={apt.status}
                        onChange={e => handleStatusChange(apt.id, e.target.value)}
                        className="text-xs border border-gray-200 rounded px-1.5 py-1"
                      >
                        <option value="scheduled">Scheduled</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Compact week strip for mobile */}
        <div className="mt-4 flex gap-1">
          {days.map(day => {
            const hasAppts = appointments.some(a => new Date(a.startTime).toDateString() === day.toDateString())
            const isSelected = day.toDateString() === currentDate.toDateString()
            return (
              <button
                key={day.toISOString()}
                onClick={() => setCurrentDate(new Date(day))}
                className={`flex-1 flex flex-col items-center py-2 rounded-lg text-xs transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
              >
                <span>{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                <span className="font-medium mt-0.5">{day.getDate()}</span>
                {hasAppts && <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-purple-400'}`} />}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── DESKTOP: Week grid ────────────────────────────── */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronLeft size={18} /></button>
          <h2 className="font-medium text-gray-700 text-sm">
            Week of {days[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h2>
          <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg"><ChevronRight size={18} /></button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-8 border-b border-gray-200">
            <div className="p-3 border-r border-gray-200" />
            {days.map(day => (
              <div
                key={day.toISOString()}
                onClick={() => setCurrentDate(new Date(day))}
                className={`p-3 text-center border-r border-gray-200 last:border-r-0 cursor-pointer ${isToday(day) ? 'bg-purple-50' : 'hover:bg-gray-50'}`}
              >
                <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                <div className={`text-sm font-medium mt-0.5 ${isToday(day) ? 'text-purple-600' : 'text-gray-900'}`}>{day.getDate()}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-8" style={{ minHeight: '600px' }}>
            <div className="border-r border-gray-200">
              {HOURS.map(h => (
                <div key={h} className="h-12 border-b border-gray-100 px-2 flex items-start pt-1">
                  <span className="text-xs text-gray-400">{h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}</span>
                </div>
              ))}
            </div>
            {days.map(day => {
              const dayApts = appointments.filter(apt => new Date(apt.startTime).toDateString() === day.toDateString())
              return (
                <div key={day.toISOString()} className={`border-r border-gray-200 last:border-r-0 relative ${isToday(day) ? 'bg-purple-50/30' : ''}`}>
                  {HOURS.map(h => <div key={h} className="h-12 border-b border-gray-100" />)}
                  {!loading && dayApts.map(apt => (
                    <Link
                      key={apt.id}
                      href={`/schedule/${apt.id}`}
                      className="absolute left-1 right-1 bg-blue-500 text-white rounded p-1 text-xs overflow-hidden hover:bg-blue-600 z-10"
                      style={{ top: `${getTopPercent(apt.startTime)}%`, height: `${Math.max(getHeightPercent(apt.startTime, apt.endTime), 4)}%` }}
                    >
                      <div className="font-medium truncate">{apt.customerName}</div>
                      <div className="opacity-80 truncate capitalize">{apt.type}</div>
                    </Link>
                  ))}
                </div>
              )
            })}
          </div>
        </div>

        {/* List below grid */}
        <div className="mt-4 bg-white rounded-xl border border-gray-100">
          <div className="p-4 border-b border-gray-100 text-sm font-medium text-gray-900">This Week</div>
          <div className="divide-y divide-gray-50">
            {appointments.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">No appointments this week</div>
            ) : appointments.map(apt => (
              <div key={apt.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500 w-28">{formatDate(apt.startTime)}</div>
                  <div className="text-sm font-medium text-purple-600 w-20">{formatTime(apt.startTime)}</div>
                  <div>
                    <div className="font-medium text-gray-900 text-sm">{apt.customerName}</div>
                    <div className="text-xs text-gray-500 capitalize">{apt.type || 'Fitting'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={apt.status} />
                  <select value={apt.status} onChange={e => handleStatusChange(apt.id, e.target.value)} className="text-xs border border-gray-200 rounded px-2 py-1">
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
