import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
    const admin = await isAdmin()

    if (!admin) {
        redirect('/')
    }

    const supabase = await createClient()

    // Get statistics
    const { count: totalRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })

    const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        Admin Dashboard
                    </h1>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Rooms
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    {totalRooms || 0}
                                </dd>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Bookings
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    {totalBookings || 0}
                                </dd>
                            </div>
                        </div>
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">
                                    Total Users
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                    {totalUsers || 0}
                                </dd>
                            </div>
                        </div>
                    </div>

                    {/* Management Links */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Link
                            href="/admin/rooms"
                            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Manage Rooms
                                </h3>
                                <p className="text-sm text-gray-500">
                                    Add, edit, or delete meeting rooms
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/bookings"
                            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Manage Bookings
                                </h3>
                                <p className="text-sm text-gray-500">
                                    View and manage all bookings
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/users"
                            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Manage Users
                                </h3>
                                <p className="text-sm text-gray-500">
                                    View and manage user accounts
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
