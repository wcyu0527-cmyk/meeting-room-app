import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminBookingsList from './AdminBookingsList'

export default async function AdminBookingsPage() {
    const admin = await isAdmin()

    if (!admin) {
        redirect('/')
    }

    const supabase = await createClient()

    const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
      id,
      title,
      start_time,
      end_time,
      user_id,
      room_id,
      rooms (
        name
      )
    `)
        .order('start_time', { ascending: false })
        .limit(100)

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Manage Bookings
                        </h1>
                        <Link
                            href="/admin"
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← Back to Admin
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            Error: {error.message}
                        </div>
                    )}

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <AdminBookingsList bookings={bookings || []} />
                    </div>
                </div>
            </main>
        </div>
    )
}
