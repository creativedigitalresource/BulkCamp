export interface BasecampToken {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface BasecampIdentity {
  id: number
  name: string
  email_address: string
  avatar_url?: string
}

export interface BasecampAccount {
  id: number
  name: string
  href: string
}

export interface TodoAssignee {
  id: number
  name: string
  avatar_url: string
}

export interface TodoParent {
  id: number
  title: string
  type: string
  app_url: string
}

export interface TodoBucket {
  id: number
  name: string
  type: string
}

export interface Todo {
  id: number
  title: string
  content: string
  due_on: string | null
  completed: boolean
  assignees: TodoAssignee[]
  parent: TodoParent
  bucket: TodoBucket
  app_url: string
  type: string
}

export interface GroupedAssignments {
  overdue: Todo[]
  today: Todo[]
  upcoming: { [date: string]: Todo[] }
  nodates: Todo[]
}

export type BulkAction = 'due_date' | 'complete'
