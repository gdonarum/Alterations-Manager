export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, data } = body

  try {
    if (action === 'draft_message') {
      const { customerName, jobType, ticketNumber, status, phone } = data
      const prompt = `You are helping an alterations seamstress draft a text message to a customer.
Customer name: ${customerName}
Job: ${jobType}
Ticket #: ${ticketNumber}
Status: ${status}
${phone ? `Customer phone: ${phone}` : ''}

Write a friendly, professional, brief text message (under 160 characters if possible) appropriate for this status update. Just output the message text, nothing else.`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      })
      return NextResponse.json({ message: message.content[0].type === 'text' ? message.content[0].text : '' })
    }

    if (action === 'scheduling_suggestion') {
      const { date, existingAppointments } = data
      const prompt = `You are a scheduling assistant for an alterations business that operates 9am-9pm.
Date: ${date}
Existing appointments: ${JSON.stringify(existingAppointments)}

Suggest 3 available time slots (30 or 60 minutes each) for new appointments on this date, avoiding conflicts. Format as JSON array: [{"start": "HH:MM", "end": "HH:MM", "label": "morning/afternoon/evening"}]`

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }],
      })
      const text = message.content[0].type === 'text' ? message.content[0].text : '[]'
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      return NextResponse.json({ slots: jsonMatch ? JSON.parse(jsonMatch[0]) : [] })
    }

    if (action === 'chat') {
      const { messages: chatMessages } = data
      const today = new Date()

      const [activeTicketsSnap, todayAppts, recentPayments] = await Promise.all([
        adminDb.collection('tickets').where('status', 'in', ['received', 'in_progress']).count().get(),
        adminDb.collection('appointments')
          .where('startTime', '>=', Timestamp.fromDate(new Date(today.setHours(0, 0, 0, 0))))
          .where('startTime', '<=', Timestamp.fromDate(new Date(today.setHours(23, 59, 59, 999))))
          .get(),
        adminDb.collection('payments').orderBy('date', 'desc').limit(5).get(),
      ])

      const appts = todayAppts.docs.filter(d => d.data().status !== 'cancelled')
        .map(d => `${d.data().customerName} at ${(d.data().startTime as Timestamp).toDate().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`)

      const payments = recentPayments.docs.map(d => `$${d.data().amount} from ${d.data().customerName} via ${d.data().method}`)

      const systemPrompt = `You are an AI assistant for a home alterations business. You help the seamstress with scheduling, customer communication, and business management.

Current context:
- Active tickets in progress: ${activeTicketsSnap.data().count}
- Today's appointments: ${appts.length > 0 ? appts.join(', ') : 'none'}
- Recent payments: ${payments.length > 0 ? payments.join(', ') : 'none'}

Business hours: 9am–9pm. Payment methods: Venmo, Zelle, Cash. Be helpful, concise, and friendly.`

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        system: systemPrompt,
        messages: chatMessages,
      })
      return NextResponse.json({ message: response.content[0].type === 'text' ? response.content[0].text : '' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('AI error:', error)
    return NextResponse.json({ error: 'AI request failed' }, { status: 500 })
  }
}
