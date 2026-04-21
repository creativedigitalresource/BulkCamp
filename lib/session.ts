import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'
import { BasecampToken, BasecampIdentity, BasecampAccount } from './types'

export interface SessionData {
  token?: BasecampToken
  identity?: BasecampIdentity
  accounts?: BasecampAccount[]
  activeAccountId?: number
}

const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'bc_assignments_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies()
  return getIronSession<SessionData>(cookieStore, sessionOptions)
}
