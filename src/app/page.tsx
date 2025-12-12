import Navbar from '@/components/Navbar'

import TodayBookings from '@/components/TodayBookings'
import AllBookings from '@/components/AllBookings'
import MonthCalendar from '@/components/MonthCalendar'
import { createClient } from '@/utils/supabase/server'
import { Room, BookingWithRoom } from '@/types'

export default async function Home({ searchParams }: { searchParams: { error?: string } }) {
  const supabase = await createClient()
  const params = await searchParams
  const errorMsg = params?.error

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  let currentUserUnitId: string | undefined = undefined
  if (user) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('unit_id')
      .eq('id', user.id)
      .single()

    if (userProfile?.unit_id) {
      currentUserUnitId = userProfile.unit_id
    }
  }

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
  const { data: allBookingsData } = await supabase
    .from('bookings')
    .select('*, rooms(*), units(name)')
    .gte('end_time', now.toISOString())
    .order('start_time')
    .limit(50)

  // Fetch profiles for these bookings
  let allBookingsWithProfile = []
  if (allBookingsData && allBookingsData.length > 0) {
    const userIds = Array.from(new Set(allBookingsData.map(b => b.user_id)))
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

    allBookingsWithProfile = allBookingsData.map(booking => ({
      ...booking,
      profile: profileMap.get(booking.user_id)
    }))
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">

          {errorMsg === 'permission_denied' && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    您的帳號無相關權限
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Today's Meetings Section */}
          <div className="mb-8">
            <TodayBookings initialBookings={todayBookings as unknown as BookingWithRoom[]} />
          </div>

          {/* Month Calendar Section - Only for logged in users */}
          {user && (
            <div className="mb-8">
              <MonthCalendar initialBookings={monthBookings} rooms={rooms as Room[]} userUnitId={currentUserUnitId} />
            </div>
          )}

          {/* All Current Bookings Section (Renamed & Moved) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              尚未開始
            </h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <AllBookings bookings={allBookingsWithProfile} />
            </div>
          </div>

          {/* Room Introduction Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4">
              會議室總覽
            </h2>
            <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                      名稱
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                      容納人數
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                      設備
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {rooms?.map((room) => (
                    <tr key={room.id} className="hover:bg-muted/30 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                        {room.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                        {room.capacity} 人
                      </td>
                      <td className="px-3 py-4 text-sm text-muted-foreground">
                        {room.equipment && room.equipment.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {room.equipment.map((item: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">無設備</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {(!rooms || rooms.length === 0) && (
                    <tr>
                      <td colSpan={3} className="px-3 py-4 text-sm text-center text-muted-foreground">
                        無會議室資料
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
