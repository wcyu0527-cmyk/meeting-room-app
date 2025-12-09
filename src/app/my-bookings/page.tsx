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
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-foreground mb-6">
                        我的預約
                    </h1>
                    <div className="bg-card text-card-foreground rounded-lg border border-border">
                        <MyBookings bookings={myBookings || []} userId={user.id} />
                    </div>
                </div>
            </main>
        </div>
    )
}
