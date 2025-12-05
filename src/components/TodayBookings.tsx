import { Booking, Room } from '@/types'

type BookingWithRoom = Booking & {
    rooms: Room
}

export default function TodayBookings({ bookings }: { bookings: BookingWithRoom[] }) {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500">
                No meetings scheduled for today
            </div>
        )
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Time
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Room
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Title
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    {bookings.map((booking) => {
                        const startTime = new Date(booking.start_time)
                        const endTime = new Date(booking.end_time)

                        return (
                            <tr key={booking.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="font-medium text-gray-900">
                                        {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="text-gray-500">
                                        to {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                    {booking.rooms.name}
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-900">
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
