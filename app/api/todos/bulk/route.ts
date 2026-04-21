import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { updateTodoDueDate, completeTodo } from '@/lib/basecamp'

interface BulkPayload {
  action: 'due_date' | 'complete'
  todos: { id: number; bucketId: number; title: string }[]
  dueOn?: string
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session.token || !session.activeAccountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, todos, dueOn }: BulkPayload = await req.json()
  const accountId = session.activeAccountId
  const token = session.token.access_token

  const results = await Promise.allSettled(
    todos.map(async (todo, i) => {
      // Stagger requests to avoid rate limits
      await new Promise(r => setTimeout(r, i * 150))
      if (action === 'due_date' && dueOn) {
        return updateTodoDueDate(accountId, token, todo.bucketId, todo.id, todo.title, dueOn)
      } else if (action === 'complete') {
        return completeTodo(accountId, token, todo.bucketId, todo.id)
      }
    })
  )

  const succeeded = results.filter(r => r.status === 'fulfilled').length
  const failed = results.filter(r => r.status === 'rejected').length

  return NextResponse.json({ succeeded, failed })
}
