'use client'

import { createClient } from '@/utils/supabase/client'
import { ThemeToggle } from '@/components/ThemeToggle'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [userName, setUserName] = useState<string>('')
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const supabase = createClient()

        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            if (user) {
                fetchUserProfile(user.id)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchUserProfile(session.user.id)
            } else {
                setIsAdmin(false)
                setUserName('')
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchUserProfile = async (userId: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', userId)
            .single()

        if (data) {
            setIsAdmin(data.role === 'admin')
            setUserName(data.full_name || '')
        }
    }

    const signOut = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        setMobileMenuOpen(false)
        router.push('/login')
        router.refresh()
    }

    const isActive = (path: string) => {
        return pathname === path
    }

    return (
        <nav className="bg-background border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary">
                                    <path d="M3 7V5c0-1.1.9-2 2-2h2" /><path d="M17 3h2c1.1 0 2 .9 2 2v2" /><path d="M21 17v2c0 1.1-.9 2-2 2h-2" /><path d="M7 21H5c-1.1 0-2-.9-2-2v-2" /><rect width="10" height="8" x="7" y="8" rx="1" />
                                </svg>
                                <span>中工段會議室</span>
                            </Link>
                        </div>
                        {/* Desktop Navigation */}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${isActive('/')
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
                                    }`}
                            >
                                首頁
                            </Link>
                            {user && (
                                <Link
                                    href="/my-bookings"
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${isActive('/my-bookings')
                                        ? 'text-primary border-b-2 border-primary'
                                        : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
                                        }`}
                                >
                                    我的預約
                                </Link>
                            )}
                            {user && (
                                <Link
                                    href="/admin"
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors ${pathname?.startsWith('/admin')
                                        ? 'text-destructive border-b-2 border-destructive'
                                        : 'text-destructive/80 hover:text-destructive border-b-2 border-transparent'
                                        }`}
                                >
                                    管理後台
                                </Link>
                            )}
                        </div>
                    </div>
                    {/* Desktop User Menu */}
                    <div className="hidden sm:flex sm:items-center gap-4">
                        <ThemeToggle />
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                    {user.email?.split('@')[0]}{userName ? `(${userName})` : ''}
                                </span>
                                <button
                                    onClick={signOut}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
                                >
                                    登出
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                            >
                                登入
                            </Link>
                        )}
                    </div>
                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                            aria-expanded="false"
                        >
                            <span className="sr-only">開啟選單</span>
                            {/* Icon when menu is closed */}
                            <svg
                                className={`${mobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                            {/* Icon when menu is open */}
                            <svg
                                className={`${mobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden border-t border-border`}>
                <div className="pt-2 pb-3 space-y-1 px-2">
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/')
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            }`}
                    >
                        首頁
                    </Link>
                    {user && (
                        <Link
                            href="/my-bookings"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${isActive('/my-bookings')
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                }`}
                        >
                            我的預約
                        </Link>
                    )}
                    {user && (
                        <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${pathname?.startsWith('/admin')
                                ? 'bg-destructive/10 text-destructive'
                                : 'text-destructive/80 hover:bg-destructive/10 hover:text-destructive'
                                }`}
                        >
                            管理後台
                        </Link>
                    )}
                </div>
                <div className="pt-4 pb-3 border-t border-border">
                    <div className="flex items-center justify-between px-4 mb-4">
                        <span className="text-sm font-medium text-muted-foreground">切換主題</span>
                        <ThemeToggle />
                    </div>
                    {user ? (
                        <div className="space-y-3 px-4">
                            <div className="text-base font-medium text-foreground">
                                {user.email?.split('@')[0]}{userName ? `(${userName})` : ''}
                            </div>
                            <button
                                onClick={signOut}
                                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                                登出
                            </button>
                        </div>
                    ) : (
                        <div className="px-4">
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block w-full text-center rounded-md bg-primary px-3 py-2 text-base font-medium text-primary-foreground hover:bg-primary/90"
                            >
                                登入
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
