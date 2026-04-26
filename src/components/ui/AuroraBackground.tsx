export function AuroraBackground({ children, className = '' }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/4 animate-aurora-1"
          style={{
            borderRadius: '50%', filter: 'blur(80px)', opacity: 0.07,
            width: 600, height: 600, background: 'radial-gradient(circle, #f59e0b, transparent)'
          }} 
        />
        <div 
          className="absolute top-1/3 right-1/4 animate-aurora-2"
          style={{
            borderRadius: '50%', filter: 'blur(80px)', opacity: 0.07,
            width: 500, height: 500, background: 'radial-gradient(circle, #6366f1, transparent)'
          }} 
        />
        <div 
          className="absolute bottom-1/4 left-1/3 animate-aurora-3"
          style={{
            borderRadius: '50%', filter: 'blur(80px)', opacity: 0.07,
            width: 400, height: 400, background: 'radial-gradient(circle, #10b981, transparent)'
          }} 
        />
      </div>
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  )
}
