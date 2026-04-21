import { NextRequest, NextResponse } from 'next/server'
import { exchangeCode, getIdentityAndAccounts } from '@/lib/basecamp'
import { getSession } from '@/lib/session'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!code) {
    return NextResponse.redirect(`${appUrl}/?error=no_code`)
  }

  try {
    const token = await exchangeCode(code)
    const { identity, accounts } = await getIdentityAndAccounts(token.access_token)

    const session = await getSession()
    session.token = token
    session.identity = identity
    session.accounts = accounts
    session.activeAccountId = accounts[0]?.id
    await session.save()

    return NextResponse.redirect(`${appUrl}/assignments`)
  } catch {
    return NextResponse.redirect(`${appUrl}/?error=auth_failed`)
  }
}
