import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const session = await getSession()
  if (session.token && session.identity) {
    redirect('/assignments')
  }

  const { error } = await searchParams

  return (
    <main className="min-h-screen bg-[#F5F2EE] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-[#1D2D35] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Basecamp Assignments</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Bulk manage your Basecamp todos — change due dates, mark complete, all at once.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error === 'no_code' ? 'Authorization was cancelled.' : 'Authentication failed. Please try again.'}
          </div>
        )}

        <Link
          href="/api/auth/login"
          className="inline-flex items-center gap-3 bg-[#1D2D35] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#2a3f4a] transition-colors w-full justify-center"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
          </svg>
          Connect with Basecamp
        </Link>

        <p className="text-xs text-gray-400 mt-4">
          You&apos;ll be redirected to Basecamp to authorize access.
        </p>
      </div>
    </main>
  )
}
