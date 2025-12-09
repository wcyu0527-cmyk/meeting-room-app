'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface MobileViewContextType {
    isMobileView: boolean
    toggleMobileView: () => void
}

const MobileViewContext = createContext<MobileViewContextType | undefined>(undefined)

export function MobileViewProvider({ children }: { children: ReactNode }) {
    const [isMobileView, setIsMobileView] = useState(false)

    const toggleMobileView = () => setIsMobileView(!isMobileView)

    return (
        <MobileViewContext.Provider value={{ isMobileView, toggleMobileView }}>
            <div
                className={
                    isMobileView
                        ? "max-w-[430px] mx-auto border-x border-border min-h-screen shadow-2xl bg-background transition-all duration-300 ease-in-out overflow-x-hidden"
                        : "w-full transition-all duration-300 ease-in-out"
                }
            >
                {children}
            </div>
        </MobileViewContext.Provider>
    )
}

export function useMobileView() {
    const context = useContext(MobileViewContext)
    if (context === undefined) {
        throw new Error('useMobileView must be used within a MobileViewProvider')
    }
    return context
}
