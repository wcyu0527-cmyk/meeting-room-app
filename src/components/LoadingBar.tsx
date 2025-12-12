'use client'

import { useEffect, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

export default function LoadingBar() {
    const [loading, setLoading] = useState(false)
    const pathname = usePathname()
    const searchParams = useSearchParams()

    useEffect(() => {
        setLoading(false)
    }, [pathname, searchParams])

    useEffect(() => {
        const handleStart = () => setLoading(true)
        const handleComplete = () => setLoading(false)

        // Listen for link clicks
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            const link = target.closest('a')

            if (link && link.href && !link.href.startsWith('#') && link.href.startsWith(window.location.origin)) {
                const url = new URL(link.href)
                if (url.pathname !== pathname) {
                    handleStart()
                }
            }
        }

        document.addEventListener('click', handleClick, true)

        return () => {
            document.removeEventListener('click', handleClick, true)
        }
    }, [pathname])

    if (!loading) return null

    return (
        <>
            {/* Top loading bar */}
            <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20">
                <div className="h-full bg-primary animate-loading-bar origin-left" />
            </div>

            {/* Full screen overlay with spinner */}
            <div className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className="absolute inset-0 border-4 border-primary/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">載入中...</p>
                </div>
            </div>
        </>
    )
}
