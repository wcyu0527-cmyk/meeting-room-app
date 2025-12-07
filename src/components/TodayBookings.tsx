'use client'

import { Booking, Room } from '@/types'

type BookingWithRoom = Booking & {
    rooms: Room
}

export default function TodayBookings({ bookings }: { bookings: BookingWithRoom[] }) {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                今日無會議
            </div>
        )
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                            時間
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            會議室
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            主題
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {bookings.map((booking) => {
                        const startTime = new Date(booking.start_time)
                        const endTime = new Date(booking.end_time)

                        return (
                            <tr key={booking.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="font-medium text-foreground">
                                        {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })} -
                                        {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                    {booking.rooms.name}
                                </td>
                                <td className="px-3 py-4 text-sm text-foreground">
                                    {booking.title}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
