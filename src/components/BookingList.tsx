'use client'

import { createClient } from '@/utils/supabase/client'
import { Booking } from '@/types'
import { useEffect, useState } from 'react'

export default function BookingList({
    initialBookings,
    roomId,
}: {
    initialBookings: Booking[]
    roomId: string
}) {
    const [bookings, setBookings] = useState<Booking[]>(initialBookings)
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('realtime bookings')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'bookings',
                    filter: `room_id=eq.${roomId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setBookings((prev) => [...prev, payload.new as Booking])
                    } else if (payload.eventType === 'DELETE') {
                        setBookings((prev) =>
                            prev.filter((booking) => booking.id !== payload.old.id)
                        )
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, supabase])

    return (
        <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900">Current Bookings</h3>
            <div className="mt-4 flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Title
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            Start Time
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                        >
                                            End Time
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bookings.map((booking) => (
                                        <tr key={booking.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {booking.title}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(booking.start_time).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(booking.end_time).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                    {bookings.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={3}
                                                className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                                            >
                                                No bookings yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
