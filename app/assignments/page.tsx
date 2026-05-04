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
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <form action="/api/auth/logout" method="POST" className="absolute top-0 right-0">
            <button type="submit" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Sign out
            </button>
          </form>
          {identity.avatar_url && (
            <img src={identity.avatar_url} alt={identity.name} className="w-12 h-12 rounded-full mx-auto mb-3" />
          )}
          <h1 className="text-3xl font-bold text-gray-900">Here are your assignments</h1>
        </div>

        <AssignmentsClient />
      </div>
    </main>
  )
}
