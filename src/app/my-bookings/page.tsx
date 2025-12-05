import Navbar from '@/components/Navbar'
import MyBookings from '@/components/MyBookings'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyBookingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const now = new Date()
    const { data: myBookings, error } = await supabase
        .from('bookings')
        .select('*, rooms(*)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching my bookings:', error)
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        My Bookings
                    </h1>
                    <div className="bg-white rounded-lg">
                        <MyBookings bookings={myBookings || []} userId={user.id} />
                    </div>
                </div>
            </main>
        </div>
    )
}
