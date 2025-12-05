'use client'

import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'

export default function Navbar() {
    const [user, setUser] = useState<User | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const supabase = createClient()
        
        // Get initial user
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            if (user) {
                checkAdmin(user.id)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                checkAdmin(session.user.id)
            } else {
                setIsAdmin(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const checkAdmin = async (userId: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single()
        
        setIsAdmin(data?.is_admin ?? false)
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
        <nav className="bg-white shadow">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link href="/" className="text-xl font-bold text-indigo-600">
                                Meeting Room App
                            </Link>
                        </div>
                        {/* Desktop Navigation */}
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                                    isActive('/') 
                                        ? 'text-indigo-600 border-b-2 border-indigo-600' 
                                        : 'text-gray-900 hover:text-indigo-600'
                                }`}
                            >
                                Rooms
                            </Link>
                            {user && (
                                <Link
                                    href="/my-bookings"
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                                        isActive('/my-bookings') 
                                            ? 'text-indigo-600 border-b-2 border-indigo-600' 
                                            : 'text-gray-900 hover:text-indigo-600'
                                    }`}
                                >
                                    My Bookings
                                </Link>
                            )}
                            {isAdmin && (
                                <Link
                                    href="/admin"
                                    className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                                        pathname?.startsWith('/admin')
                                            ? 'text-red-600 border-b-2 border-red-600' 
                                            : 'text-red-600 hover:text-red-700'
                                    }`}
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                    {/* Desktop User Menu */}
                    <div className="hidden sm:flex sm:items-center">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-700">
                                    {user.email}
                                </span>
                                <button 
                                    onClick={signOut}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    Sign out
                                </button>
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="text-sm text-indigo-600 hover:text-indigo-500"
                            >
                                Sign in
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
                            <span className="sr-only">Open main menu</span>
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
            <div className={`${mobileMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
                <div className="pt-2 pb-3 space-y-1">
                    <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                            isActive('/')
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                        }`}
                    >
                        Rooms
                    </Link>
                    {user && (
                        <Link
                            href="/my-bookings"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                isActive('/my-bookings')
                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                            }`}
                        >
                            My Bookings
                        </Link>
                    )}
                    {isAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${
                                pathname?.startsWith('/admin')
                                    ? 'bg-red-50 border-red-500 text-red-700'
                                    : 'border-transparent text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-800'
                            }`}
                        >
                            Admin
                        </Link>
                    )}
                </div>
                <div className="pt-4 pb-3 border-t border-gray-200">
                    {user ? (
                        <div className="space-y-1">
                            <div className="px-4 py-2">
                                <div className="text-base font-medium text-gray-800">
                                    {user.email}
                                </div>
                            </div>
                            <button
                                onClick={signOut}
                                className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                            >
                                Sign out
                            </button>
                        </div>
                    ) : (
                        <div className="px-4">
                            <Link
                                href="/login"
                                onClick={() => setMobileMenuOpen(false)}
                                className="block text-base font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Sign in
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
