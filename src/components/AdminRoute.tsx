import { Navigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useProfile } from '../hooks/useProfile'

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser()
  const { profileLoading, profileExists } = useProfile()

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-danger border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  if (isSignedIn && !profileExists) {
    return <Navigate to="/onboarding" replace />
  }

  const isAdminEmail = user?.primaryEmailAddress?.emailAddress === 'agnighosh207@gmail.com'

  if (!isAdminEmail) {
    console.warn("High-level security: Access denied. Admins only.")
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
