import Navbar from '@/components/Navbar'
import BookingForm from '@/components/BookingForm'
import BookingList from '@/components/BookingList'
import { createClient } from '@/utils/supabase/server'
import { Room, Booking } from '@/types'
import { notFound } from 'next/navigation'

export default async function RoomPage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const supabase = await createClient()
    const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

    if (!room) {
        notFound()
    }

    const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', id)
        .order('start_time', { ascending: true })

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                {room.name}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                                Capacity: {room.capacity} | Equipment: {room.equipment?.join(', ')}
                            </p>
                        </div>
                        {room.image_url && (
                            <div className="border-t border-gray-200">
                                <img
                                    src={room.image_url}
                                    alt={room.name}
                                    className="w-full h-64 object-cover"
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <BookingForm roomId={room.id} />
                        </div>
                        <div>
                            <BookingList
                                initialBookings={(bookings as Booking[]) || []}
                                roomId={room.id}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
