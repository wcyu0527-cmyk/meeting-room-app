import Navbar from '@/components/Navbar'
import RoomCard from '@/components/RoomCard'
import TodayBookings from '@/components/TodayBookings'
import AllBookings from '@/components/AllBookings'
import MonthCalendar from '@/components/MonthCalendar'
import { createClient } from '@/utils/supabase/server'
import { Room, Booking, BookingWithRoom } from '@/types'

export default async function Home() {
  const supabase = await createClient()

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rooms, error } = await supabase.from('rooms').select('*').order('name')

  if (error) {
    console.error('Error fetching rooms:', error)
  }

  // Get today's bookings
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data: todayBookings } = await supabase
    .from('bookings')
    .select('*, rooms(*)')
    .gte('start_time', today.toISOString())
    .lt('start_time', tomorrow.toISOString())
    .order('start_time')

  // Get all current bookings (future bookings)
  const now = new Date()
  const { data: allBookings } = await supabase
    .from('bookings')
    .select('*, rooms(*)')
    .gte('end_time', now.toISOString())
    .order('start_time')
    .limit(50)

  // Get current month bookings if user is logged in
  let monthBookings: BookingWithRoom[] = []
  if (user) {
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    const { data: mb } = await supabase
      .from('bookings')
      .select('*, rooms(*)')
      .gte('start_time', startOfMonth.toISOString())
      .lte('end_time', endOfMonth.toISOString())

    if (mb) monthBookings = mb as unknown as BookingWithRoom[]
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {/* Today's Meetings Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              今日會議
            </h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <TodayBookings bookings={todayBookings || []} />
            </div>
          </div>

          {/* Month Calendar Section - Only for logged in users */}
          {user && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
                月曆總覽
              </h2>
              <MonthCalendar initialBookings={monthBookings} rooms={rooms as Room[]} />
            </div>
          )}

          {/* Available Meeting Rooms Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              可用會議室
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms?.map((room) => (
                <RoomCard key={room.id} room={room as Room} />
              ))}
            </div>
            {(!rooms || rooms.length === 0) && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">找不到會議室。</p>
              </div>
            )}
          </div>

          {/* All Current Bookings Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              所有預約
            </h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <AllBookings bookings={allBookings || []} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
