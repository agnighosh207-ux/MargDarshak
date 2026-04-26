import { SignUp } from '@clerk/clerk-react'
import { AuthLayout } from '../../layouts/AuthLayout'

const appearance = {
  variables: {
    colorPrimary: '#f59e0b',
    colorBackground: '#0f1220',
    colorText: '#f1f5f9',
    colorTextSecondary: '#64748b',
    colorInputBackground: '#0a0c14',
    colorInputText: '#f1f5f9',
    colorInputPlaceholder: '#475569',
    borderRadius: '0.625rem',
    fontFamily: 'Geist, Inter, sans-serif',
    fontSize: '15px'
  },
  elements: {
    card: 'bg-transparent shadow-none border-0 p-0',
    headerTitle: 'text-white text-2xl font-bold tracking-tight',
    headerSubtitle: 'text-muted text-sm',
    socialButtonsBlockButton: 'border border-[rgba(255,255,255,0.07)] bg-[#141828] hover:bg-[rgba(245,158,11,0.08)] text-white transition-all duration-200',
    formButtonPrimary: 'bg-primary hover:bg-amber-400 text-black font-semibold transition-all duration-200 shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    footerActionLink: 'text-primary hover:text-amber-400 transition-colors',
    formFieldInput: 'bg-[#0a0c14] border-[rgba(255,255,255,0.07)] text-white focus:border-primary focus:shadow-[0_0_0_1px_#f59e0b] transition-all',
    dividerLine: 'bg-[rgba(255,255,255,0.07)]',
    dividerText: 'text-muted text-xs'
  }
}

export function RegisterPage() {
  return (
    <AuthLayout>
      <SignUp 
        appearance={appearance}
        signInUrl="/login"
        fallbackRedirectUrl="/onboarding"
        forceRedirectUrl="/onboarding"
      />
    </AuthLayout>
  )
}
