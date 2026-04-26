import { useUser } from '@clerk/clerk-react'
import { Navigate } from 'react-router-dom'
import { useProfile } from '../hooks/useProfile'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser()
  const { profileLoading, profileExists } = useProfile()

  if (!isLoaded || profileLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  if (isSignedIn && !profileExists) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
