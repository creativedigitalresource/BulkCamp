import { BasecampToken, BasecampIdentity, BasecampAccount, Todo } from './types'

const BC_API = 'https://3.basecampapi.com'
const BC_AUTH = 'https://launchpad.37signals.com'
const USER_AGENT = 'Basecamp Assignments Manager (contact@yourdigitalresource.com)'

export function getAuthUrl(state: string): string {
  const params = new URLSearchParams({
    type: 'web_server',
    client_id: process.env.BASECAMP_CLIENT_ID!,
    redirect_uri: process.env.BASECAMP_REDIRECT_URI!,
    state,
  })
  return `${BC_AUTH}/authorization/new?${params}`
}

export async function exchangeCode(code: string): Promise<BasecampToken> {
  const res = await fetch(`${BC_AUTH}/authorization/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      type: 'web_server',
      client_id: process.env.BASECAMP_CLIENT_ID!,
      client_secret: process.env.BASECAMP_CLIENT_SECRET!,
      redirect_uri: process.env.BASECAMP_REDIRECT_URI!,
      code,
    }),
  })
  if (!res.ok) throw new Error('Failed to exchange code')
  const data = await res.json()
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
  }
}

export async function getIdentityAndAccounts(token: string): Promise<{
  identity: BasecampIdentity
  accounts: BasecampAccount[]
}> {
  const res = await fetch(`${BC_AUTH}/authorization.json`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
    },
  })
  if (!res.ok) throw new Error('Failed to get identity')
  const data = await res.json()
  return {
    identity: data.identity,
    accounts: data.accounts.filter((a: { product: string }) => a.product === 'bc3'),
  }
}

async function bcFetch(url: string, token: string, options?: RequestInit) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': USER_AGENT,
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  })
  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get('Retry-After') || '2', 10)
    await new Promise(r => setTimeout(r, retryAfter * 1000))
    return bcFetch(url, token, options)
  }
  return res
}

export async function getAssignments(accountId: number, token: string): Promise<Todo[]> {
  const res = await bcFetch(`${BC_API}/${accountId}/assignments.json`, token)
  if (!res.ok) return []
  const data = await res.json()
  // assignments returns { non_priorities, priorities }
  const all = [...(data.priorities || []), ...(data.non_priorities || [])]
  return all
}

export async function getAssignmentsWithDates(accountId: number, token: string): Promise<Todo[]> {
  const all = await getAssignments(accountId, token)
  return all.filter(t => t.due_on)
}

export async function getStuffIveAssigned(accountId: number, token: string): Promise<Todo[]> {
  const res = await bcFetch(`${BC_API}/${accountId}/reports/assignments.json`, token)
  if (!res.ok) return []
  const data = await res.json()
  return data || []
}

export async function updateTodoDueDate(
  accountId: number,
  token: string,
  bucketId: number,
  todoId: number,
  title: string,
  dueOn: string
): Promise<boolean> {
  const res = await bcFetch(
    `${BC_API}/${accountId}/buckets/${bucketId}/todos/${todoId}.json`,
    token,
    {
      method: 'PUT',
      body: JSON.stringify({ content: title, due_on: dueOn }),
    }
  )
  return res.ok
}

export async function completeTodo(
  accountId: number,
  token: string,
  bucketId: number,
  todoId: number
): Promise<boolean> {
  const res = await bcFetch(
    `${BC_API}/${accountId}/buckets/${bucketId}/todos/${todoId}/completion.json`,
    token,
    { method: 'POST' }
  )
  return res.ok
}
