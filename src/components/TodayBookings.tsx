'use client'

import { useState, useEffect, useRef } from 'react'
import { Booking, Room } from '@/types'
import { createClient } from '@/utils/supabase/client'

type BookingWithRoom = Booking & {
    rooms: Room
}

export default function TodayBookings({ initialBookings }: { initialBookings?: BookingWithRoom[] }) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [bookings, setBookings] = useState<BookingWithRoom[]>(initialBookings || [])
    const [loading, setLoading] = useState(false)
    const isFirstRun = useRef(true)

    // Format date string similar to page.tsx
    // e.g. 2025年12月8日 星期一
    const dateStr = currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })
    const simpleDateStr = currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })

    const fetchBookings = async (date: Date) => {
        setLoading(true)
        const supabase = createClient()

        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(date)
        endOfDay.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('bookings')
            .select('*, rooms(*)')
            .gte('start_time', startOfDay.toISOString())
            .lte('end_time', endOfDay.toISOString())
            .order('start_time')

        if (data) {
            setBookings(data as unknown as BookingWithRoom[])
        }
        setLoading(false)
    }

    useEffect(() => {
        // Skip the first fetch if we have initial data and the date hasn't changed from "today"
        // However, currentDate is new Date() which might differ slightly from server time, 
        // but for "day" comparison it is fine.
        // To be safe, if initialBookings is provided, we skip first run.
        if (initialBookings && isFirstRun.current) {
            isFirstRun.current = false
            return
        }
        fetchBookings(currentDate)
    }, [currentDate, initialBookings])

    const changeDate = (offset: number) => {
        const newDate = new Date(currentDate)
        newDate.setDate(newDate.getDate() + offset)
        setCurrentDate(newDate)
    }

    return (
        <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground mb-4 flex items-center">
                <div className="flex items-center gap-2 mr-3">
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                        今日會議
                    </span>
                </div>
                <span className="text-lg font-normal text-muted-foreground">({dateStr})</span>
            </h2>

            <div className="rounded-xl border bg-card text-card-foreground shadow overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">載入中...</div>
                ) : (!bookings || bookings.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground">
                        本日無會議
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted/50">
                            <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6 w-[220px]">
                                    時間
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground w-[150px]">
                                    會議室
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                    會議名稱
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-card">
                            {bookings.map((booking) => {
                                const startTime = new Date(booking.start_time)
                                const endTime = new Date(booking.end_time)

                                return (
                                    <tr key={booking.id} className="hover:bg-muted/30 transition-colors">
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                            <div className="font-medium text-foreground">
                                                {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })} -
                                                {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </div>
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                            {booking.rooms?.name || '未知會議室'}
                                        </td>
                                        <td className="px-3 py-4 text-sm text-foreground">
                                            {booking.title}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
