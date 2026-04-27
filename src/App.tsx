import React, { Suspense, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'
import { ProfileProvider } from './contexts/ProfileContext'

import { DashboardLayout } from './layouts/DashboardLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { PageTransition } from './components/layout/PageTransition'
import { ErrorBoundary } from './components/ErrorBoundary'
import { FullScreenLoader } from './components/FullScreenLoader'
import { SearchModal } from './components/SearchModal'
import { useToast } from './components/ui/Toast'

// Lazy Loading Pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage').then(m => ({ default: m.LoginPage })))
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage').then(m => ({ default: m.RegisterPage })))
const OnboardingPage = React.lazy(() => import('./pages/auth/OnboardingPage').then(m => ({ default: m.OnboardingPage })))

const DashboardPage = React.lazy(() => import('./pages/Dashboard').then(m => ({ default: m.DashboardPage })))
const MockTestsPage = React.lazy(() => import('./pages/tests/MockTestsPage').then(m => ({ default: m.MockTestsPage })))
const GenerateTestPage = React.lazy(() => import('./pages/tests/GenerateTestPage').then(m => ({ default: m.GenerateTestPage })))
const TestSessionPage = React.lazy(() => import('./pages/tests/TestSessionPage').then(m => ({ default: m.TestSessionPage })))
const TestResultPage = React.lazy(() => import('./pages/tests/TestResultPage').then(m => ({ default: m.TestResultPage })))
const DoubtSolverPage = React.lazy(() => import('./pages/doubts/DoubtSolverPage').then(m => ({ default: m.DoubtSolverPage })))
const AnalyticsPage = React.lazy(() => import('./pages/analytics/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const ChapterPerformancePage = React.lazy(() => import('./pages/chapters/ChapterPerformancePage').then(m => ({ default: m.ChapterPerformancePage })))
const ReferAndEarnPage = React.lazy(() => import('./pages/referral/ReferAndEarnPage').then(m => ({ default: m.ReferAndEarnPage })))
const StudyPlannerPage = React.lazy(() => import('./pages/planner/StudyPlannerPage').then(m => ({ default: m.StudyPlannerPage })))
const BillingPage = React.lazy(() => import('./pages/billing/BillingPage').then(m => ({ default: m.BillingPage })))
const SettingsPage = React.lazy(() => import('./pages/settings/SettingsPage').then(m => ({ default: m.SettingsPage })))
const SupportPage = React.lazy(() => import('./pages/SupportPage').then(m => ({ default: m.SupportPage })))
const PyqLibraryPage = React.lazy(() => import('./pages/pyqs/PyqLibraryPage').then(m => ({ default: m.PyqLibraryPage })))
const ForumPage = React.lazy(() => import('./pages/forum/ForumPage').then(m => ({ default: m.ForumPage })))
const QuestionDetailPage = React.lazy(() => import('./pages/forum/QuestionDetailPage').then(m => ({ default: m.QuestionDetailPage })))
const FocusModePage = React.lazy(() => import('./pages/focus/FocusModePage').then(m => ({ default: m.FocusModePage })))
const ShadowMatrixPage = React.lazy(() => import('./pages/ranking/ShadowMatrixPage').then(m => ({ default: m.ShadowMatrixPage })))
const RevisionHubPage = React.lazy(() => import('./pages/revision/RevisionHubPage').then(m => ({ default: m.RevisionHubPage })))
const ParentConnectPage = React.lazy(() => import('./pages/settings/ParentConnectPage').then(m => ({ default: m.ParentConnectPage })))
const BrahmastraHubPage = React.lazy(() => import('./pages/brahmastra/BrahmastraHubPage').then(m => ({ default: m.BrahmastraHubPage })))
const BountyArenaPage = React.lazy(() => import('./pages/BountyArenaPage').then(m => ({ default: m.BountyArenaPage })))
const MargStorePage = React.lazy(() => import('./pages/store/MargStorePage').then(m => ({ default: m.MargStorePage })))
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))

const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard').then(m => ({ default: m.AdminDashboard })))
const UserManagement = React.lazy(() => import('./pages/admin/UserManagement').then(m => ({ default: m.UserManagement })))
const RankManagement = React.lazy(() => import('./pages/admin/RankManagement').then(m => ({ default: m.RankManagement })))
const AppConfig = React.lazy(() => import('./pages/admin/AppConfig').then(m => ({ default: m.AppConfig })))
const TestAnalytics = React.lazy(() => import('./pages/admin/TestAnalytics').then(m => ({ default: m.TestAnalytics })))

const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })))
const PricingPage = React.lazy(() => import('./pages/PricingPage').then(m => ({ default: m.PricingPage })))

export default function App() {
  const location = useLocation()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { toast } = useToast()
  
  // Custom global hook implementation here or we just attach an event listener in useEffect
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsSearchOpen(true)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Online/Offline Detection
  React.useEffect(() => {
    const handleOnline = () => {
      toast({
        type: 'success',
        title: 'Wapas aa gaye! ✅',
        description: 'You are back online.'
      })
    }

    const handleOffline = () => {
      toast({
        type: 'error',
        title: 'Internet nahi hai yaar 😅',
        description: 'Kuch features work nahi karenge jab tak network na ho.'
      })
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast])

  return (
    <ErrorBoundary>
      <ProfileProvider>
        <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
        <Suspense fallback={<FullScreenLoader />}>
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
              <Route path="/pricing" element={<PageTransition><PricingPage /></PageTransition>} />
              
              <Route path="/login/*" element={<PageTransition><LoginPage /></PageTransition>} />
              <Route path="/register/*" element={<PageTransition><RegisterPage /></PageTransition>} />
              <Route path="/onboarding" element={<PageTransition><OnboardingPage /></PageTransition>} />
              
              {/* Dashboard Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout title="Dashboard"><PageTransition><DashboardPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/tests" element={<ProtectedRoute><DashboardLayout title="Mock Tests"><PageTransition><MockTestsPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/tests/new" element={<ProtectedRoute><DashboardLayout title="Generate Test"><PageTransition><GenerateTestPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/tests/:id" element={<ProtectedRoute><PageTransition><TestSessionPage /></PageTransition></ProtectedRoute>} />
              <Route path="/tests/:id/result" element={<ProtectedRoute><DashboardLayout title="Test Results"><PageTransition><TestResultPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/doubts" element={<ProtectedRoute><DashboardLayout title="Doubt Solver"><PageTransition><DoubtSolverPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/chapters" element={<ProtectedRoute><DashboardLayout title="Weak Chapters"><PageTransition><ChapterPerformancePage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><DashboardLayout title="Analytics"><PageTransition><AnalyticsPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/planner" element={<ProtectedRoute><DashboardLayout title="Study Planner"><PageTransition><StudyPlannerPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><DashboardLayout title="Settings"><PageTransition><SettingsPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/billing" element={<ProtectedRoute><DashboardLayout title="Plans & Billing"><PageTransition><BillingPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/referral" element={<ProtectedRoute><DashboardLayout title="Refer & Earn"><PageTransition><ReferAndEarnPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/library" element={<ProtectedRoute><DashboardLayout title="PYQ Library"><PageTransition><PyqLibraryPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/forum" element={<ProtectedRoute><DashboardLayout title="Community Forum"><PageTransition><ForumPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/forum/:id" element={<ProtectedRoute><DashboardLayout title="Forum Thread"><PageTransition><QuestionDetailPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/focus" element={<ProtectedRoute><DashboardLayout title="Focus Engine"><PageTransition><FocusModePage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/matrix" element={<ProtectedRoute><DashboardLayout title="Shadow Matrix"><PageTransition><ShadowMatrixPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/revision" element={<ProtectedRoute><DashboardLayout title="Revision Hub"><PageTransition><RevisionHubPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/parent-connect" element={<ProtectedRoute><DashboardLayout title="Parent Connect"><PageTransition><ParentConnectPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/brahmastra" element={<ProtectedRoute><DashboardLayout title="Brahmastra Exclusives"><PageTransition><BrahmastraHubPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/bounty" element={<ProtectedRoute><DashboardLayout title="Bounty Arena"><PageTransition><BountyArenaPage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/store" element={<ProtectedRoute><DashboardLayout title="Marg Store"><PageTransition><MargStorePage /></PageTransition></DashboardLayout></ProtectedRoute>} />
              <Route path="/support" element={<DashboardLayout title="Support"><PageTransition><SupportPage /></PageTransition></DashboardLayout>} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminLayout title="Admin Dashboard"><PageTransition><AdminDashboard /></PageTransition></AdminLayout></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminLayout title="User Management"><PageTransition><UserManagement /></PageTransition></AdminLayout></AdminRoute>} />
              <Route path="/admin/ranks" element={<AdminRoute><AdminLayout title="Rank Management"><PageTransition><RankManagement /></PageTransition></AdminLayout></AdminRoute>} />
              <Route path="/admin/config" element={<AdminRoute><AdminLayout title="App Config"><PageTransition><AppConfig /></PageTransition></AdminLayout></AdminRoute>} />
              <Route path="/admin/tests" element={<AdminRoute><AdminLayout title="Test Analytics"><PageTransition><TestAnalytics /></PageTransition></AdminLayout></AdminRoute>} />
              
              <Route path="*" element={<PageTransition><NotFoundPage /></PageTransition>} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </ProfileProvider>
    </ErrorBoundary>
  )
}
