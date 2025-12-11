'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

type ReportBooking = {
    id: string
    title: string
    start_time: string
    end_time: string
    user_id: string
    category: string
    eco_box_count: number
    no_packaging_count: number
    takeout_count: number
    approved_disposable_count: number
    cannot_comply_reason: string
    notes: string | null
    rooms: {
        name: string
    }
    units: {
        name: string
    } | null
}

export default function ReportsClient() {
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [bookings, setBookings] = useState<ReportBooking[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async () => {
        if (!startDate || !endDate) {
            alert('請選擇開始與結束日期')
            return
        }

        setLoading(true)
        setHasSearched(true)
        const supabase = createClient()

        // Adjust end date to include the whole day
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                rooms (name),
                units (name)
            `)
            .gte('start_time', new Date(startDate).toISOString())
            .lte('start_time', endDateTime.toISOString())
            .order('start_time', { ascending: false })

        if (error) {
            console.error('Error fetching reports:', error)
            alert('查詢失敗: ' + error.message)
            setLoading(false)
            return
        }

        const bookingsWithProfile: ReportBooking[] = data || []

        setBookings(bookingsWithProfile || [])
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            {/* Search Controls */}
            <div className="flex flex-wrap items-end gap-4 bg-muted/50 p-4 rounded-md border border-border">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        開始日期
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm h-10 px-3 border text-foreground bg-background"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        結束日期
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm h-10 px-3 border text-foreground bg-background"
                    />
                </div>
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 h-10"
                >
                    {loading ? '查詢中...' : '查詢'}
                </button>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                日期/時間
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                會議室
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                登記單位
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                主題/類別
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                環保餐盒
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                未使用包裝水/紙杯
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                外帶餐盒
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                簽准免洗餐盒
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                                無法配合原因
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                        <div>
                                            {new Date(booking.start_time).getFullYear()}/{String(new Date(booking.start_time).getMonth() + 1).padStart(2, '0')}/{String(new Date(booking.start_time).getDate()).padStart(2, '0')}
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                        {booking.rooms?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                        {booking.units?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                        <div className="font-medium">{booking.title}</div>
                                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                            {booking.category}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                                        {booking.eco_box_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                                        {booking.no_packaging_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                                        {booking.takeout_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">
                                        {booking.approved_disposable_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                        {booking.cannot_comply_reason}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-6 py-4 text-center text-sm text-muted-foreground">
                                    {hasSearched ? '此日期區間無預約紀錄' : '請選擇日期並點擊查詢'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
