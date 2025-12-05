import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function Navbar() {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const admin = await isAdmin()

    const signOut = async () => {
        'use server'
        const supabase = await createClient()
        await supabase.auth.signOut()
        redirect('/login')
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
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link
                                href="/"
                                className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600"
                            >
                                Rooms
                            </Link>
                            {user && (
                                <Link
                                    href="/my-bookings"
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 hover:text-indigo-600"
                                >
                                    My Bookings
                                </Link>
                            )}
                            {admin && (
                                <Link
                                    href="/admin"
                                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-red-600 hover:text-red-700"
                                >
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-700">
                                    {user.email}
                                </span>
                                <form action={signOut}>
                                    <button className="text-sm text-gray-500 hover:text-gray-700">
                                        Sign out
                                    </button>
                                </form>
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
                </div>
            </div>
        </nav>
    )
}
