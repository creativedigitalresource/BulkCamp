'use client'

import { useState, useEffect, useCallback } from 'react'
import { Todo } from '@/lib/types'
import AssignmentItem from './AssignmentItem'
import BulkActionBar from './BulkActionBar'

type Tab = 'all' | 'dates' | 'assigned'

function groupByDate(todos: Todo[]) {
  const today = new Date().toISOString().split('T')[0]
  const overdue: Todo[] = []
  const todayItems: Todo[] = []
  const upcoming: { [date: string]: Todo[] } = {}
  const nodates: Todo[] = []

  for (const todo of todos) {
    if (!todo.due_on) {
      nodates.push(todo)
    } else if (todo.due_on < today) {
      overdue.push(todo)
    } else if (todo.due_on === today) {
      todayItems.push(todo)
    } else {
      if (!upcoming[todo.due_on]) upcoming[todo.due_on] = []
      upcoming[todo.due_on].push(todo)
    }
  }

  return { overdue, today: todayItems, upcoming, nodates }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase()
}

interface SectionProps {
  label: string
  labelClass?: string
  todos: Todo[]
  selected: Set<number>
  onToggle: (todo: Todo) => void
  onToggleAll: (todos: Todo[]) => void
}

function Section({ label, labelClass, todos, selected, onToggle, onToggleAll }: SectionProps) {
  if (!todos.length) return null
  const allSelected = todos.every(t => selected.has(t.id))

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className={`text-sm font-semibold ${labelClass || 'text-gray-700'}`}>{label}</h2>
        <button
          onClick={() => onToggleAll(todos)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {todos.map(todo => (
          <div key={todo.id} className="border-b border-gray-50 last:border-b-0">
            <AssignmentItem todo={todo} selected={selected.has(todo.id)} onToggle={onToggle} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AssignmentsClient() {
  const [tab, setTab] = useState<Tab>('all')
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchTodos = useCallback(async (t: Tab) => {
    setLoading(true)
    setSelected(new Set())
    try {
      const res = await fetch(`/api/assignments?tab=${t}`)
      const data = await res.json()
      setTodos(data.todos || [])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos(tab)
  }, [tab, fetchTodos])

  const toggleTodo = (todo: Todo) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(todo.id)) next.delete(todo.id)
      else next.add(todo.id)
      return next
    })
  }

  const toggleAll = (todos: Todo[]) => {
    const allSelected = todos.every(t => selected.has(t.id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) todos.forEach(t => next.delete(t.id))
      else todos.forEach(t => next.add(t.id))
      return next
    })
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleBulkAction = async (action: 'due_date' | 'complete', dueOn?: string) => {
    setBulkLoading(true)
    const selectedTodos = todos.filter(t => selected.has(t.id)).map(t => ({
      id: t.id,
      bucketId: t.bucket.id,
      title: t.title || t.content,
    }))

    try {
      const res = await fetch('/api/todos/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, todos: selectedTodos, dueOn }),
      })
      const data = await res.json()
      showToast(`Done: ${data.succeeded} updated${data.failed ? `, ${data.failed} failed` : ''}`)
      setSelected(new Set())
      await fetchTodos(tab)
    } finally {
      setBulkLoading(false)
    }
  }

  const { overdue, today, upcoming, nodates } = groupByDate(todos)
  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'My assignments' },
    { key: 'dates', label: 'My assignments with dates' },
    { key: 'assigned', label: "Stuff I've assigned" },
  ]

  return (
    <div className="relative">
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading assignments…
        </div>
      ) : todos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No assignments found.</div>
      ) : (
        <>
          <Section label="Overdue" labelClass="text-red-500" todos={overdue} selected={selected} onToggle={toggleTodo} onToggleAll={toggleAll} />
          <Section label="Due today" todos={today} selected={selected} onToggle={toggleTodo} onToggleAll={toggleAll} />
          {Object.entries(upcoming).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
            <Section key={date} label={formatDate(date)} todos={items} selected={selected} onToggle={toggleTodo} onToggleAll={toggleAll} />
          ))}
          <Section label="No due date" todos={nodates} selected={selected} onToggle={toggleTodo} onToggleAll={toggleAll} />
        </>
      )}

      {selected.size > 0 && (
        <BulkActionBar
          count={selected.size}
          onDueDate={date => handleBulkAction('due_date', date)}
          onComplete={() => handleBulkAction('complete')}
          onClear={() => setSelected(new Set())}
          loading={bulkLoading}
        />
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
