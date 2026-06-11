'use client'

interface ConnectionBannerProps {
  connected: boolean
}

export default function ConnectionBanner({ connected }: ConnectionBannerProps) {
  if (connected) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-500 text-white text-center py-2.5 text-sm font-semibold animate-pulse">
      🔴 Connection Lost: Reconnecting... Your changes may not save.
    </div>
  )
}