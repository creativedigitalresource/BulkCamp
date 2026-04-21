import { NextResponse } from 'next/server'
import { getAuthUrl } from '@/lib/basecamp'
import { getSession } from '@/lib/session'

export async function GET() {
  const state = crypto.randomUUID()
  const session = await getSession()
  // Store state for CSRF validation
  ;(session as unknown as Record<string, string>).oauthState = state
  await session.save()
  return NextResponse.redirect(getAuthUrl(state))
}
