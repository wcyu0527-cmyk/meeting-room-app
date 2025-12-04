import Navbar from '@/components/Navbar'
import RoomCard from '@/components/RoomCard'
import { createClient } from '@/utils/supabase/server'
import { Room } from '@/types'

export default async function Home() {
  const supabase = await createClient()
  const { data: rooms } = await supabase.from('rooms').select('*').order('name')

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Available Meeting Rooms
          </h1>
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
      </main>
    </div>
  )
}
