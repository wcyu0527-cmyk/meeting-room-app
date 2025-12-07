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

    const { data: rawBookings, error } = await supabase
        .from('bookings')
        .select(`
      id,
      title,
      start_time,
      end_time,
      user_id,
      room_id,
      rooms!inner (
        name
      )
    `)
        .order('start_time', { ascending: false })
        .limit(100)

    // Transform the data to match the expected type
    const bookings = rawBookings?.map((booking: any) => ({
        id: booking.id,
        title: booking.title,
        start_time: booking.start_time,
        end_time: booking.end_time,
        user_id: booking.user_id,
        rooms: {
            name: booking.rooms.name
        }
    })) || []

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            管理預約
                        </h1>
                        <Link
                            href="/admin"
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← 返回管理後台
                        </Link>
                    </div>

                    {error && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            錯誤: {error.message}
                        </div>
                    )}

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <AdminBookingsList bookings={bookings} />
                    </div>
                </div>
            </main>
        </div>
    )
}
