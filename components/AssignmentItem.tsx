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
      className={`flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-colors ${
        selected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
      onClick={() => onToggle(todo)}
    >
      <div
        className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          selected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
        }`}
      >
        {selected && (
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-sm text-gray-800 truncate block">{todo.title || todo.content}</span>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {todo.assignees?.map(a => (
          <img
            key={a.id}
            src={a.avatar_url}
            alt={a.name}
            title={a.name}
            className="w-6 h-6 rounded-full"
          />
        ))}
        <a
          href={todo.app_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 hover:text-gray-500 transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}
