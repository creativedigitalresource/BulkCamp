'use client'

import { useState } from 'react'

interface Props {
  count: number
  onDueDate: (date: string) => void
  onComplete: () => void
  onClear: () => void
  loading: boolean
}

export default function BulkActionBar({ count, onDueDate, onComplete, onClear, loading }: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [date, setDate] = useState('')

  const handleDateSubmit = () => {
    if (!date) return
    onDueDate(date)
    setShowDatePicker(false)
    setDate('')
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-[#1D2D35] text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
        <span className="text-sm font-medium">
          {count} selected
        </span>

        <div className="w-px h-5 bg-white/20" />

        {showDatePicker ? (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg border border-white/20 focus:outline-none focus:border-white/50"
              autoFocus
            />
            <button
              onClick={handleDateSubmit}
              disabled={!date || loading}
              className="bg-white text-[#1D2D35] text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating…' : 'Apply'}
            </button>
            <button
              onClick={() => setShowDatePicker(false)}
              className="text-white/60 hover:text-white text-sm"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setShowDatePicker(true)}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm hover:text-blue-300 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Change due date
            </button>

            <button
              onClick={onComplete}
              disabled={loading}
              className="flex items-center gap-1.5 text-sm hover:text-green-300 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {loading ? 'Working…' : 'Mark complete'}
            </button>
          </>
        )}

        <div className="w-px h-5 bg-white/20" />

        <button
          onClick={onClear}
          className="text-white/60 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
