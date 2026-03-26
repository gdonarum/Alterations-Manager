'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, ChevronLeft, ChevronRight, Calendar, Sparkles } from 'lucide-react'
import { formatTime, formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

interface Appointment {
  id: string
  startTime: string
  endTime: string
  type: string
  notes?: string
  status: string
  customer: { id: string; name: string; phone?: string }
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 9) // 9am to 9pm

export default function SchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [aiSlots, setAiSlots] = useState<Array<{ start: string; end: string; label: string }>>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

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

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.startTime)
      return aptDate.toDateString() === date.toDateString()
    })
  }

  const getTopPercent = (time: string) => {
    const d = new Date(time)
    const mins = (d.getHours() - 9) * 60 + d.getMinutes()
    return (mins / (12 * 60)) * 100
  }

  const getHeightPercent = (start: string, end: string) => {
    const s = new Date(start)
    const e = new Date(end)
    const mins = (e.getTime() - s.getTime()) / 60000
    return (mins / (12 * 60)) * 100
  }

  const fetchAiSlots = async () => {
    setLoadingSlots(true)
    const todayApts = getAppointmentsForDay(currentDate)
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'scheduling_suggestion',
        data: {
          date: currentDate.toDateString(),
          existingAppointments: todayApts.map(a => ({
            start: formatTime(a.startTime),
            end: formatTime(a.endTime),
            customer: a.customer.name,
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
          <p className="text-gray-500 text-sm mt-1">Business hours: 9am – 9pm</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAiSlots}
            disabled={loadingSlots}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Sparkles size={14} />
            {loadingSlots ? 'Thinking...' : 'Suggest slots'}
          </button>
          <Link
            href="/schedule/new"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Plus size={16} />
            New Appointment
          </Link>
        </div>
      </div>

      {/* AI Slot Suggestions */}
      {aiSlots.length > 0 && (
        <div className="mb-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
          <p className="text-sm font-medium text-purple-800 mb-2 flex items-center gap-1">
            <Sparkles size={14} /> AI Suggested Open Slots for Today
          </p>
          <div className="flex gap-2 flex-wrap">
            {aiSlots.map((slot, i) => (
              <span key={i} className="px-3 py-1.5 bg-white text-purple-700 rounded-lg text-sm border border-purple-200">
                {slot.start} – {slot.end} <span className="text-purple-400">({slot.label})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Week nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() - 7); return n })}
          className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-medium text-gray-700">
          Week of {days[0].toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </h2>
        <button onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(d.getDate() + 7); return n })}
          className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-gray-200">
          <div className="p-3 text-xs text-gray-400 border-r border-gray-200" />
          {days.map(day => (
            <div key={day.toISOString()} className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${isToday(day) ? 'bg-purple-50' : ''}`}>
              <div className="text-xs text-gray-500">{day.toLocaleDateString('en-US', { weekday: 'short' })}</div>
              <div className={`text-sm font-medium mt-0.5 ${isToday(day) ? 'text-purple-600' : 'text-gray-900'}`}>
                {day.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-8" style={{ minHeight: '600px' }}>
          {/* Time labels */}
          <div className="border-r border-gray-200">
            {HOURS.map(h => (
              <div key={h} className="h-12 border-b border-gray-100 px-2 flex items-start pt-1">
                <span className="text-xs text-gray-400">
                  {h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map(day => {
            const dayApts = getAppointmentsForDay(day)
            return (
              <div key={day.toISOString()} className={`border-r border-gray-200 last:border-r-0 relative ${isToday(day) ? 'bg-purple-50/30' : ''}`}>
                {HOURS.map(h => (
                  <div key={h} className="h-12 border-b border-gray-100" />
                ))}
                {/* Appointments */}
                {!loading && dayApts.map(apt => (
                  <Link
                    key={apt.id}
                    href={`/schedule/${apt.id}`}
                    className="absolute left-1 right-1 bg-blue-500 text-white rounded p-1 text-xs overflow-hidden hover:bg-blue-600 transition-colors z-10"
                    style={{
                      top: `${getTopPercent(apt.startTime)}%`,
                      height: `${Math.max(getHeightPercent(apt.startTime, apt.endTime), 4)}%`,
                    }}
                  >
                    <div className="font-medium truncate">{apt.customer.name}</div>
                    <div className="opacity-80 truncate capitalize">{apt.type}</div>
                  </Link>
                ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Today's list view */}
      <div className="mt-6 bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-medium text-gray-900 flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            All Upcoming Appointments
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {appointments.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No appointments this week</div>
          ) : (
            appointments.map(apt => (
              <div key={apt.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-500 w-36">{formatDate(apt.startTime)}</div>
                  <div className="text-sm font-medium text-purple-600 w-20">{formatTime(apt.startTime)}</div>
                  <div>
                    <div className="font-medium text-gray-900">{apt.customer.name}</div>
                    <div className="text-sm text-gray-500 capitalize">{apt.type || 'Fitting'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={apt.status} />
                  <select
                    value={apt.status}
                    onChange={e => handleStatusChange(apt.id, e.target.value)}
                    className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
