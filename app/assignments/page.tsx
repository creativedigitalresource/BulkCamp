import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import AssignmentsClient from '@/components/AssignmentsClient'

export default async function AssignmentsPage() {
  const session = await getSession()
  if (!session.token || !session.identity) {
    redirect('/')
  }

  const { identity } = session

  return (
    <main className="min-h-screen bg-[#F5F2EE]">
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {identity.avatar_url && (
              <img src={identity.avatar_url} alt={identity.name} className="w-10 h-10 rounded-full" />
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">Here are your assignments</h1>
              <p className="text-sm text-gray-500">{identity.name}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>

        <AssignmentsClient />
      </div>
    </main>
  )
}
