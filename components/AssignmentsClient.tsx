'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Todo } from '@/lib/types'
import AssignmentItem from './AssignmentItem'
import BulkActionBar from './BulkActionBar'

type Tab = 'all' | 'dates' | 'assigned'

function groupByDate(todos: Todo[]) {
  const today = new Date().toISOString().split('T')[0]
  const overdue: { [date: string]: Todo[] } = {}
  const todayItems: Todo[] = []
  const upcoming: { [date: string]: Todo[] } = {}
  const nodates: Todo[] = []

  for (const todo of todos) {
    if (!todo.due_on) {
      nodates.push(todo)
    } else if (todo.due_on < today) {
      if (!overdue[todo.due_on]) overdue[todo.due_on] = []
      overdue[todo.due_on].push(todo)
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
  priorities: Set<number>
  newIds: Set<number>
  onToggle: (todo: Todo) => void
  onToggleAll: (todos: Todo[]) => void
  onTogglePriority: (todo: Todo) => void
  onMarkSeen: (todo: Todo) => void
}

function Section({ label, labelClass, todos, selected, priorities, newIds, onToggle, onToggleAll, onTogglePriority, onMarkSeen }: SectionProps) {
  if (!todos.length) return null
  const allSelected = todos.every(t => selected.has(t.id))

  const groups: { [key: string]: Todo[] } = {}
  for (const todo of todos) {
    const key = todo.parent?.title || todo.bucket?.name || 'Other'
    if (!groups[key]) groups[key] = []
    groups[key].push(todo)
  }

  return (
    <div className="flex gap-6">
      <div className="w-24 flex-shrink-0 text-right pt-3">
        <div className={`text-xs font-bold tracking-wide leading-tight ${labelClass || 'text-gray-600'}`}>
          {label}
        </div>
        <button
          onClick={() => onToggleAll(todos)}
          className="text-xs text-gray-300 hover:text-gray-500 transition-colors mt-1"
        >
          {allSelected ? 'Deselect' : 'Select all'}
        </button>
      </div>

      <div className="flex-1 min-w-0 border-t border-gray-200 pt-3 pb-5">
        {Object.entries(groups).map(([groupName, groupTodos]) => (
          <div key={groupName} className="mb-3">
            <div className="text-xs font-semibold text-orange-700 uppercase tracking-wider mb-1 px-2">
              {groupName}
            </div>
            {groupTodos.map(todo => (
              <AssignmentItem
                key={todo.id}
                todo={todo}
                selected={selected.has(todo.id)}
                onToggle={onToggle}
                isPriority={priorities.has(todo.id)}
                onTogglePriority={onTogglePriority}
                isNew={newIds.has(todo.id)}
                onMarkSeen={onMarkSeen}
              />
            ))}
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
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [priorities, setPriorities] = useState<Set<number>>(new Set())
  const [seenIds, setSeenIds] = useState<Set<number>>(new Set())
  const [mounted, setMounted] = useState(false)
  const seededRef = useRef(false)

  // Load all localStorage state after mount (avoids SSR mismatch)
  useEffect(() => {
    setNotes(localStorage.getItem('bc-notes') || '')

    const savedPriorities = localStorage.getItem('bc-priorities')
    if (savedPriorities) setPriorities(new Set(JSON.parse(savedPriorities)))

    const savedSeen = localStorage.getItem('bc-seen-ids')
    if (savedSeen) setSeenIds(new Set(JSON.parse(savedSeen)))

    setMounted(true)
  }, [])

  const fetchTodos = useCallback(async (t: Tab) => {
    setLoading(true)
    setSelected(new Set())
    setError(null)
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const res = await fetch(`/api/assignments?tab=${t}`, { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) {
        setError(`API error: ${res.status} ${res.statusText}`)
        return
      }
      const data = await res.json()
      setTodos(data.todos || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTodos(tab)
  }, [tab, fetchTodos])

  // On first-ever load: seed seenIds with all current todos so nothing shows as new
  useEffect(() => {
    if (!mounted || loading || todos.length === 0 || seededRef.current) return
    seededRef.current = true
    if (!localStorage.getItem('bc-seen-ids')) {
      const allIds = todos.map(t => t.id)
      localStorage.setItem('bc-seen-ids', JSON.stringify(allIds))
      setSeenIds(new Set(allIds))
    }
  }, [mounted, loading, todos])

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

  const togglePriority = (todo: Todo) => {
    setPriorities(prev => {
      const next = new Set(prev)
      if (next.has(todo.id)) next.delete(todo.id)
      else next.add(todo.id)
      localStorage.setItem('bc-priorities', JSON.stringify([...next]))
      return next
    })
  }

  const markAllSeen = () => {
    const next = new Set([...seenIds, ...todos.map(t => t.id)])
    setSeenIds(next)
    localStorage.setItem('bc-seen-ids', JSON.stringify([...next]))
  }

  const markSeen = (todo: Todo) => {
    const next = new Set([...seenIds, todo.id])
    setSeenIds(next)
    localStorage.setItem('bc-seen-ids', JSON.stringify([...next]))
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
    localStorage.setItem('bc-notes', e.target.value)
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

  const newTodos = mounted ? todos.filter(t => !seenIds.has(t.id)) : []
  const newIds = new Set(newTodos.map(t => t.id))
  const priorityTodos = todos.filter(t => priorities.has(t.id))
  const { overdue, today: todayTodos, upcoming, nodates } = groupByDate(todos)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'all', label: 'My assignments' },
    { key: 'dates', label: 'My assignments with dates' },
    { key: 'assigned', label: "Stuff I've assigned" },
  ]

  return (
    <div className="relative">

      {/* ── New assignments ── */}
      {newTodos.length > 0 && (
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">New</span>
              <span className="text-xs font-bold text-white bg-blue-500 rounded-full px-1.5 py-0.5 leading-none">
                {newTodos.length}
              </span>
            </div>
            <button
              onClick={markAllSeen}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Mark all seen
            </button>
          </div>
          {newTodos.map(todo => (
            <AssignmentItem
              key={todo.id}
              todo={todo}
              selected={selected.has(todo.id)}
              onToggle={toggleTodo}
              isPriority={priorities.has(todo.id)}
              onTogglePriority={togglePriority}
              isNew
              onMarkSeen={markSeen}
            />
          ))}
        </div>
      )}

      {/* ── Notepad ── */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Quick notes</span>
        </div>
        <textarea
          value={notes}
          onChange={handleNotesChange}
          placeholder="Jot something down…"
          className="w-full text-sm text-gray-700 placeholder-gray-300 bg-transparent resize-none focus:outline-none leading-relaxed"
          rows={3}
        />
      </div>

      {/* ── Priorities ── */}
      <div className="mb-6 pb-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">My priorities today</span>
        </div>
        {priorityTodos.length === 0 ? (
          <p className="text-sm text-gray-300 pl-1">Star an assignment below to pin it here.</p>
        ) : (
          priorityTodos.map(todo => (
            <AssignmentItem
              key={todo.id}
              todo={todo}
              selected={selected.has(todo.id)}
              onToggle={toggleTodo}
              isPriority
              onTogglePriority={togglePriority}
              isNew={newIds.has(todo.id)}
              onMarkSeen={markSeen}
            />
          ))
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-gray-300 mb-8">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors -mb-px ${
              tab === t.key
                ? 'border-b-2 border-gray-900 text-gray-900'
                : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent'
            }`}
          >
            {t.label}
          </button>
        ))}
        {!loading && todos.length > 0 && (
          <button
            onClick={() => toggleAll(todos)}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors pb-2"
          >
            {todos.every(t => selected.has(t.id)) ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      {/* ── Assignments list ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading assignments…
        </div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : todos.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No assignments found.</div>
      ) : (
        <>
          {Object.keys(overdue).length > 0 && (
            <div className="flex gap-6 mb-0">
              <div className="w-24 flex-shrink-0" />
              <div className="flex-1 border-t border-gray-200 pt-3 pb-2">
                <span className="text-sm font-bold text-red-600">Overdue</span>
              </div>
            </div>
          )}
          {Object.entries(overdue).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
            <Section key={date} label={formatDate(date)} labelClass="text-red-500" todos={items} selected={selected} priorities={priorities} newIds={newIds} onToggle={toggleTodo} onToggleAll={toggleAll} onTogglePriority={togglePriority} onMarkSeen={markSeen} />
          ))}

          {todayTodos.length > 0 && (
            <div className="flex gap-6 mb-0">
              <div className="w-24 flex-shrink-0" />
              <div className="flex-1 border-t border-gray-200 pt-3 pb-2">
                <span className="text-sm font-bold text-gray-800">Due today</span>
              </div>
            </div>
          )}
          <Section label="Today" todos={todayTodos} selected={selected} priorities={priorities} newIds={newIds} onToggle={toggleTodo} onToggleAll={toggleAll} onTogglePriority={togglePriority} onMarkSeen={markSeen} />

          {Object.entries(upcoming).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
            <Section key={date} label={formatDate(date)} todos={items} selected={selected} priorities={priorities} newIds={newIds} onToggle={toggleTodo} onToggleAll={toggleAll} onTogglePriority={togglePriority} onMarkSeen={markSeen} />
          ))}

          <Section label="No date" todos={nodates} selected={selected} priorities={priorities} newIds={newIds} onToggle={toggleTodo} onToggleAll={toggleAll} onTogglePriority={togglePriority} onMarkSeen={markSeen} />
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
