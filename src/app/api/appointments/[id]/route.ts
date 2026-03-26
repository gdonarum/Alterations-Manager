export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { updateCalendarEvent } from '@/lib/google-calendar'
import { getSession } from '@/lib/session'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()

  const existing = await adminDb.collection('appointments').doc(id).get()
  const existingData = existing.data()

  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }
  if (body.status) updates.status = body.status
  if (body.notes !== undefined) updates.notes = body.notes
  if (body.startTime) updates.startTime = Timestamp.fromDate(new Date(body.startTime))
  if (body.endTime) updates.endTime = Timestamp.fromDate(new Date(body.endTime))

  await adminDb.collection('appointments').doc(id).update(updates)

  // Sync to Google Calendar
  const session = await getSession()
  if (session?.googleAccessToken && existingData?.googleEventId) {
    await updateCalendarEvent(session.googleAccessToken, existingData.googleEventId, {
      startTime: body.startTime ? new Date(body.startTime) : undefined,
      endTime: body.endTime ? new Date(body.endTime) : undefined,
      status: body.status,
    })
  }

  return NextResponse.json({ id, ...existingData, ...body })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const doc = await adminDb.collection('appointments').doc(id).get()
  const data = doc.data()

  await adminDb.collection('appointments').doc(id).update({
    status: 'cancelled',
    updatedAt: FieldValue.serverTimestamp(),
  })

  // Remove from Google Calendar
  const session = await getSession()
  if (session?.googleAccessToken && data?.googleEventId) {
    await updateCalendarEvent(session.googleAccessToken, data.googleEventId, { status: 'cancelled' })
  }

  return NextResponse.json({ success: true })
}
