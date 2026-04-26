import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'

interface Props { children?: ReactNode }
interface State { hasError: boolean; error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080a10] text-white flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-danger/20 rounded-full animate-ping" />
            <AlertTriangle className="w-10 h-10 text-danger relative z-10" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Something went wrong</h1>
          <p className="text-sm text-muted font-mono bg-surface border border-border p-4 rounded-lg mb-8 max-w-md break-all">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
            <Button onClick={() => window.location.href = '/dashboard'}>Go Home</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
