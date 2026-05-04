import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { getAssignments, getAssignmentsWithDates, getStuffIveAssigned } from '@/lib/basecamp'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session.token || !session.activeAccountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const tab = new URL(req.url).searchParams.get('tab') || 'all'
  const accountId = session.activeAccountId
  const token = session.token.access_token

  try {
    let todos
    if (tab === 'dates') {
      todos = await getAssignmentsWithDates(accountId, token)
    } else if (tab === 'assigned') {
      todos = await getStuffIveAssigned(accountId, token)
    } else {
      todos = await getAssignments(accountId, token)
    }
    return NextResponse.json({ todos })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
