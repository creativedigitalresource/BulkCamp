'use client'

import { Todo } from '@/lib/types'

interface Props {
  todo: Todo
  selected: boolean
  onToggle: (todo: Todo) => void
}

export default function AssignmentItem({ todo, selected, onToggle }: Props) {
  return (
    <div
      className={`flex items-start gap-3 py-1.5 px-2 cursor-pointer rounded transition-colors ${
        selected ? 'bg-amber-50' : 'hover:bg-black/[0.04]'
      }`}
      onClick={() => onToggle(todo)}
    >
      {/* Square checkbox */}
      <div
        className={`w-4 h-4 mt-0.5 border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'bg-blue-500 border-blue-500' : 'border-gray-400 bg-white'
        }`}
      >
        {selected && (
          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className="text-sm text-gray-900 leading-snug">{todo.title || todo.content}</span>
        {todo.assignees?.map(a => (
          <span key={a.id} className="flex items-center gap-1 flex-shrink-0">
            <img src={a.avatar_url} alt={a.name} title={a.name} className="w-5 h-5 rounded-full" />
            <span className="text-xs text-gray-500">
              {a.name.split(' ')[0]} {a.name.split(' ')[1]?.[0]}.
            </span>
          </span>
        ))}
      </div>

      <a
        href={todo.app_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0 mt-0.5"
        onClick={e => e.stopPropagation()}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  )
}
