import Navbar from '@/components/Navbar'
import RoomCard from '@/components/RoomCard'
import TodayBookings from '@/components/TodayBookings'
import AllBookings from '@/components/AllBookings'
import MyBookings from '@/components/MyBookings'
import { createClient } from '@/utils/supabase/server'
import { Room } from '@/types'

export default async function Home() {
  const supabase = await createClient()
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

  // Get current user's bookings
  const { data: { user } } = await supabase.auth.getUser()
  const { data: myBookings } = user ? await supabase
    .from('bookings')
    .select('*, rooms(*)')
    .eq('user_id', user.id)
    .gte('end_time', now.toISOString())
    .order('start_time')
    : { data: null }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Today's Meetings Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Today's Meetings
            </h2>
            <div className="bg-white rounded-lg">
              <TodayBookings bookings={todayBookings || []} />
            </div>
          </div>

          {/* My Bookings Section */}
          {user && myBookings && myBookings.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                My Bookings
              </h2>
              <div className="bg-white rounded-lg">
                <MyBookings bookings={myBookings} userId={user.id} />
              </div>
            </div>
          )}

          {/* Available Meeting Rooms Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Available Meeting Rooms
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms?.map((room) => (
                <RoomCard key={room.id} room={room as Room} />
              ))}
            </div>
            {(!rooms || rooms.length === 0) && (
              <div className="text-center py-12">
                <p className="text-gray-500">No meeting rooms found.</p>
              </div>
            )}
          </div>

          {/* All Current Bookings Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              All Current Bookings
            </h2>
            <div className="bg-white rounded-lg">
              <AllBookings bookings={allBookings || []} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
