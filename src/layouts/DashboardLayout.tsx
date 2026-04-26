
import { Sidebar } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { TopBar } from '../components/layout/TopBar'
import { useProfile } from '../hooks/useProfile'
import { AiStudyBuddy } from '../components/AiStudyBuddy'
import { ReferralModal } from '../components/referral/ReferralModal'


import { MaintenanceBanner } from '../components/MaintenanceBanner'

export function DashboardLayout({ children, title }: { children: React.ReactNode, title?: string }) {
  const { profile } = useProfile()

  return (
    <div className="min-h-screen bg-bg text-text relative">
      {!profile?.is_admin && <MaintenanceBanner />}
      <Sidebar />
      <TopBar title={title} />
      
      <main className="lg:ml-60 pt-16 pb-20 lg:pb-6 px-4 lg:px-8 py-6 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      <AiStudyBuddy />
      <ReferralModal />
      <MobileNav />
    </div>
  )
}
