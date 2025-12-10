import Navbar from '@/components/Navbar'
import BookingForm from '@/components/BookingForm'
import BookingList from '@/components/BookingList'
import { createClient } from '@/utils/supabase/server'
import { Booking } from '@/types'
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
            <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    {/* Room Info */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-2xl leading-6 font-bold text-gray-900">
                                {room.name}
                            </h3>
                            <p className="mt-2 text-sm text-gray-600">
                                <span className="font-medium">Capacity:</span> {room.capacity} people
                                {' | '}
                                <span className="font-medium">Equipment:</span> {room.equipment?.join(', ') || 'None'}
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

                    {/* Booking Form - Full Width */}
                    <div className="mb-6">
                        <BookingForm roomId={room.id} />
                    </div>

                    {/* Current Bookings - Full Width */}
                    <div>
                        <BookingList
                            initialBookings={(bookings as Booking[]) || []}
                            roomId={room.id}
                        />
                    </div>
                </div>
            </main>
        </div>
    )
}
