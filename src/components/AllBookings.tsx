'use client'

import { BookingWithRoom } from '@/types'





export default function AllBookings({ bookings }: { bookings: BookingWithRoom[] }) {
    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                暫無預約
            </div>
        )
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6 w-[100px] sm:w-[220px]">
                            <span className="hidden sm:inline">時間</span>
                            <span className="sm:hidden">時間</span>
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground w-[100px] sm:w-[150px]">
                            會議室
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            <span className="hidden sm:inline">會議名稱</span>
                            <span className="sm:hidden whitespace-pre-line">會議{"\n"}名稱</span>
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground w-[80px] sm:w-[100px]">
                            登記單位
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {bookings.map((booking) => {
                        const startTime = new Date(booking.start_time)
                        const endTime = new Date(booking.end_time)
                        const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60))

                        return (
                            <tr key={booking.id}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    <div className="font-medium text-foreground">
                                        {startTime.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })}
                                    </div>
                                    <div className="text-muted-foreground hidden sm:block">
                                        {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })} - {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </div>
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                    {booking.rooms?.name || '未知會議室'}
                                </td>
                                <td className="px-3 py-4 text-sm text-foreground">
                                    {booking.title}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                    {booking.units?.name || '未知'}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
