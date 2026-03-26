import { google } from 'googleapis'

function getCalendarClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })
  return google.calendar({ version: 'v3', auth: oauth2Client })
}

export async function createCalendarEvent(
  accessToken: string,
  appointment: {
    customerName: string
    type: string
    notes?: string
    startTime: Date
    endTime: Date
  }
): Promise<string | null> {
  try {
    const calendar = getCalendarClient(accessToken)
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: `${appointment.customerName} — ${appointment.type}`,
        description: appointment.notes || '',
        start: { dateTime: appointment.startTime.toISOString() },
        end: { dateTime: appointment.endTime.toISOString() },
      },
    })
    return event.data.id || null
  } catch (err) {
    console.error('Google Calendar create error:', err)
    return null
  }
}

export async function updateCalendarEvent(
  accessToken: string,
  googleEventId: string,
  updates: { startTime?: Date; endTime?: Date; status?: string }
): Promise<void> {
  try {
    const calendar = getCalendarClient(accessToken)
    if (updates.status === 'cancelled') {
      await calendar.events.delete({ calendarId: 'primary', eventId: googleEventId })
      return
    }
    const patch: Record<string, unknown> = {}
    if (updates.startTime) patch.start = { dateTime: updates.startTime.toISOString() }
    if (updates.endTime) patch.end = { dateTime: updates.endTime.toISOString() }
    await calendar.events.patch({ calendarId: 'primary', eventId: googleEventId, requestBody: patch })
  } catch (err) {
    console.error('Google Calendar update error:', err)
  }
}
