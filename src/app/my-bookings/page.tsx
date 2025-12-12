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


    const { data: myBookings, error } = await supabase
        .from('bookings')
        .select('*, rooms(*)')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .limit(50)

    if (error) {
        console.error('Error fetching my bookings:', error)
    }

    const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .order('name')

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-foreground mb-6">
                        我的預約
                    </h1>
                    <div className="bg-card text-card-foreground rounded-lg border border-border">
                        <MyBookings bookings={myBookings || []} userId={user.id} rooms={rooms || []} isAdmin={isAdmin} />
                    </div>
                </div>
            </main>
        </div>
    )
}
