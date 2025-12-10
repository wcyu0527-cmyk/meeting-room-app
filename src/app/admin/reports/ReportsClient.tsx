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
    profiles: {
        full_name: string | null
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
                rooms (name)
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

        // Fetch profiles for all user_ids in the bookings
        let bookingsWithProfile: ReportBooking[] = []
        if (data && data.length > 0) {
            const userIds = Array.from(new Set(data.map((b: { user_id: string }) => b.user_id)))
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', userIds)

            const profileMap = new Map(profiles?.map(p => [p.id, p]) || [])

            bookingsWithProfile = data.map((booking: ReportBooking) => ({
                ...booking,
                profiles: profileMap.get(booking.user_id) || null
            }))
        }

        setBookings(bookingsWithProfile)
        setLoading(false)
    }

    return (
        <div className="space-y-6">
            {/* Search Controls */}
            <div className="flex flex-wrap items-end gap-4 bg-gray-50 p-4 rounded-md border border-gray-200">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        開始日期
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3 border"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        結束日期
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm h-10 px-3 border"
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
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                日期/時間
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                會議室
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                申請人
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                主題/類別
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                環保餐盒
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                未使用包裝水/紙杯
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                外帶餐盒
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                簽准免洗餐盒
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                無法配合原因
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {bookings.length > 0 ? (
                            bookings.map((booking) => (
                                <tr key={booking.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div>{new Date(booking.start_time).toLocaleDateString()}</div>
                                        <div className="text-gray-500 text-xs">
                                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                            {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {booking.rooms?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {booking.profiles?.full_name || '未知'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <div className="font-medium">{booking.title}</div>
                                        <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                            {booking.category}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {booking.eco_box_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {booking.no_packaging_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {booking.takeout_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                        {booking.approved_disposable_count}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {booking.cannot_comply_reason}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={9} className="px-6 py-4 text-center text-sm text-gray-500">
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
