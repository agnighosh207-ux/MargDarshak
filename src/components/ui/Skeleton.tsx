import { cn } from '../../lib/utils'

const SKELETON_BASE = "bg-[linear-gradient(90deg,#0f1220_25%,#141828_50%,#0f1220_75%)] bg-[length:200%_100%] animate-shimmer rounded-md"

export function SkeletonText({ width = '100%', height = '16px', className = '' }: { width?: string | number, height?: string | number, className?: string }) {
  return <div className={cn(SKELETON_BASE, className)} style={{ width, height }} />
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn("p-5 border border-border bg-surface-2 rounded-2xl space-y-4", className)}>
      <SkeletonText width="40%" height="24px" className="mb-4" />
      <SkeletonText width="100%" />
      <SkeletonText width="80%" />
      <SkeletonText width="90%" />
    </div>
  )
}

export function SkeletonChart({ className = '' }: { className?: string }) {
  return <div className={cn(SKELETON_BASE, "w-full h-64 rounded-2xl", className)} />
}

export function SkeletonAvatar({ size = 40, className = '' }: { size?: number, className?: string }) {
  return <div className={cn(SKELETON_BASE, "rounded-full", className)} style={{ width: size, height: size }} />
}
