export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { createSession } from '@/lib/session'

const AUTHORIZED_EMAIL = process.env.AUTHORIZED_EMAIL

export async function POST(req: NextRequest) {
  const { idToken, googleAccessToken } = await req.json()

  try {
    const decoded = await adminAuth.verifyIdToken(idToken)

    if (AUTHORIZED_EMAIL && decoded.email !== AUTHORIZED_EMAIL) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const sessionToken = await createSession({
      email: decoded.email || '',
      name: decoded.name || '',
      picture: decoded.picture,
      googleAccessToken,
    })

    const res = NextResponse.json({ ok: true })
    res.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    })
    return res
  } catch (err) {
    console.error('Session creation error:', err)
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
}
