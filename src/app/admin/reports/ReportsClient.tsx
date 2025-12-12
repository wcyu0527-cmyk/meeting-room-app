'use client'

import { useState, useEffect, useRef } from 'react'
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
    // 設定預設日期為本月
    const getDefaultDates = () => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()

        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        const formatDate = (date: Date) => {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
        }

        return {
            start: formatDate(firstDay),
            end: formatDate(lastDay)
        }
    }

    const defaults = getDefaultDates()
    const [startDate, setStartDate] = useState(defaults.start)
    const [endDate, setEndDate] = useState(defaults.end)
    const [bookings, setBookings] = useState<ReportBooking[]>([])
    const [loading, setLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const initialLoadRef = useRef(true)

    // 排序狀態
    type SortField = 'date' | 'room' | 'unit' | 'title' | 'category' | 'eco_box' | 'no_packaging' | 'takeout' | 'approved_disposable' | 'cannot_comply_reason' | null
    type SortOrder = 'asc' | 'desc'
    const [sortField, setSortField] = useState<SortField>(null)
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

    // 頁面載入時自動查詢本月資料
    useEffect(() => {
        if (initialLoadRef.current) {
            initialLoadRef.current = false
            handleSearch()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])



    // 快速日期選擇
    const setDateRange = (type: 'thisWeek' | 'thisMonth' | 'lastMonth' | 'thisYear') => {
        const now = new Date()
        const year = now.getFullYear()
        const month = now.getMonth()
        const currentDay = now.getDay() // 0 is Sunday

        let start = new Date()
        let end = new Date()

        const formatDate = (date: Date) => {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()).padStart(2, '0')
            return `${y}-${m}-${d}`
        }

        switch (type) {
            case 'thisWeek':
                // Monday to Sunday
                // If today is Sunday (0), diff is 6. If Monday (1), diff is 0.
                const diffToMonday = currentDay === 0 ? 6 : currentDay - 1
                start = new Date(now)
                start.setDate(now.getDate() - diffToMonday)
                end = new Date(start)
                end.setDate(start.getDate() + 6)
                break
            case 'thisMonth':
                start = new Date(year, month, 1)
                end = new Date(year, month + 1, 0)
                break
            case 'lastMonth':
                start = new Date(year, month - 1, 1)
                end = new Date(year, month, 0)
                break
            case 'thisYear':
                start = new Date(year, 0, 1)
                end = new Date(year, 11, 31)
                break
        }

        setStartDate(formatDate(start))
        setEndDate(formatDate(end))
    }

    const handleSearch = async () => {
        if (!startDate || !endDate) {
            alert('請選擇開始與結束日期')
            return
        }

        // 驗證日期邏輯
        if (new Date(startDate) > new Date(endDate)) {
            alert('結束日期不能早於開始日期')
            return
        }

        setLoading(true)
        setHasSearched(true)
        const supabase = createClient()

        // Adjust end date to include the whole day
        // 使用 T00:00:00 確保解析為本地時間
        const startDateTime = new Date(`${startDate}T00:00:00`)
        const endDateTime = new Date(`${endDate}T23:59:59.999`)

        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                rooms (name),
                units (name)
            `)
            .gte('start_time', startDateTime.toISOString())
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

    // 排序函數
    const handleSort = (field: SortField) => {
        let newOrder: SortOrder = 'desc'

        if (sortField === field) {
            // 同一欄位：切換排序順序
            newOrder = sortOrder === 'asc' ? 'desc' : 'asc'
        }

        setSortField(field)
        setSortOrder(newOrder)
    }

    // 取得排序後的資料
    const getSortedBookings = () => {
        if (!sortField) return bookings

        const sorted = [...bookings].sort((a, b) => {
            let compareA: string | number | Date
            let compareB: string | number | Date

            switch (sortField) {
                case 'date':
                    compareA = new Date(a.start_time)
                    compareB = new Date(b.start_time)
                    const dateDiff = compareA.getTime() - compareB.getTime()
                    return sortOrder === 'asc' ? dateDiff : -dateDiff

                case 'room':
                    compareA = a.rooms?.name || ''
                    compareB = b.rooms?.name || ''
                    const roomDiff = compareA.localeCompare(compareB, 'zh-TW')
                    return sortOrder === 'asc' ? roomDiff : -roomDiff

                case 'unit':
                    compareA = a.units?.name || ''
                    compareB = b.units?.name || ''
                    const unitDiff = compareA.localeCompare(compareB, 'zh-TW')
                    return sortOrder === 'asc' ? unitDiff : -unitDiff

                case 'title':
                    compareA = a.title || ''
                    compareB = b.title || ''
                    const titleDiff = compareA.localeCompare(compareB, 'zh-TW')
                    return sortOrder === 'asc' ? titleDiff : -titleDiff

                case 'category':
                    compareA = a.category || ''
                    compareB = b.category || ''
                    const categoryDiff = compareA.localeCompare(compareB, 'zh-TW')
                    return sortOrder === 'asc' ? categoryDiff : -categoryDiff

                case 'eco_box':
                    compareA = a.eco_box_count
                    compareB = b.eco_box_count
                    return sortOrder === 'asc' ? compareA - compareB : compareB - compareA

                case 'no_packaging':
                    compareA = a.no_packaging_count
                    compareB = b.no_packaging_count
                    return sortOrder === 'asc' ? compareA - compareB : compareB - compareA

                case 'takeout':
                    compareA = a.takeout_count
                    compareB = b.takeout_count
                    return sortOrder === 'asc' ? compareA - compareB : compareB - compareA

                case 'approved_disposable':
                    compareA = a.approved_disposable_count
                    compareB = b.approved_disposable_count
                    return sortOrder === 'asc' ? compareA - compareB : compareB - compareA

                case 'cannot_comply_reason':
                    compareA = a.cannot_comply_reason || ''
                    compareB = b.cannot_comply_reason || ''
                    const reasonDiff = compareA.localeCompare(compareB, 'zh-TW')
                    return sortOrder === 'asc' ? reasonDiff : -reasonDiff

                default:
                    return 0
            }
        })

        return sorted
    }

    // 匯出CSV功能
    const handleExportCSV = () => {
        const sortedData = getSortedBookings()

        if (sortedData.length === 0) {
            alert('無資料可匯出')
            return
        }

        // CSV 表頭
        const headers = [
            '日期',
            '開始時間',
            '結束時間',
            '會議室',
            '登記單位',
            '主題',
            '類別',
            '環保餐盒',
            '未使用包裝水/紙杯',
            '外帶餐盒',
            '簽准免洗餐盒',
            '無法配合原因',
            '備註'
        ]

        // 轉換資料
        const rows = sortedData.map(booking => {
            const date = new Date(booking.start_time)
            const year = date.getFullYear()
            const month = String(date.getMonth() + 1).padStart(2, '0')
            const day = String(date.getDate()).padStart(2, '0')
            const dateStr = `${year}/${month}/${day}`

            const startTime = new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            const endTime = new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })

            return [
                dateStr,
                startTime,
                endTime,
                booking.rooms?.name || '',
                booking.units?.name || '',
                booking.title || '',
                booking.category || '',
                booking.eco_box_count,
                booking.no_packaging_count,
                booking.takeout_count,
                booking.approved_disposable_count,
                booking.cannot_comply_reason || '',
                booking.notes || ''
            ]
        })

        // 組合 CSV 內容
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => {
                // 處理包含逗號、換行符或雙引號的儲存格
                const cellStr = String(cell)
                if (cellStr.includes(',') || cellStr.includes('\n') || cellStr.includes('"')) {
                    return `"${cellStr.replace(/"/g, '""')}"`
                }
                return cellStr
            }).join(','))
        ].join('\n')

        // 建立下載
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }) // \ufeff 是 BOM，讓 Excel 正確識別 UTF-8
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        const fileName = `統計報表_${startDate}_${endDate}.csv`
        link.setAttribute('href', url)
        link.setAttribute('download', fileName)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            {/* Search Controls */}
            <div className="bg-muted/50 p-4 rounded-md border border-border">
                <div className="flex flex-wrap gap-2 mb-4">
                    <button
                        onClick={() => setDateRange('thisWeek')}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border border-input hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        本週
                    </button>
                    <button
                        onClick={() => setDateRange('thisMonth')}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border border-input hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        本月
                    </button>
                    <button
                        onClick={() => setDateRange('lastMonth')}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border border-input hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        上月
                    </button>
                    <button
                        onClick={() => setDateRange('thisYear')}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-background border border-input hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                        今年
                    </button>
                </div>
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-foreground mb-1">
                            開始日期
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            max={endDate}
                            className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm h-10 px-3 border text-foreground bg-background date-input"
                        />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium text-foreground mb-1">
                            結束日期
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm h-10 px-3 border text-foreground bg-background date-input"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 h-10"
                    >
                        {loading ? '查詢中...' : '查詢'}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={getSortedBookings().length === 0}
                        className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 h-10"
                        title="匯出為CSV檔案"
                    >
                        匯出
                    </button>
                </div>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('date')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>日期/時間</span>
                                    {sortField === 'date' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('room')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>會議室</span>
                                    {sortField === 'room' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('unit')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>登記單位</span>
                                    {sortField === 'unit' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('title')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>主題/類別</span>
                                    {sortField === 'title' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('eco_box')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>環保餐盒</span>
                                    {sortField === 'eco_box' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('no_packaging')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>未使用包裝水/紙杯</span>
                                    {sortField === 'no_packaging' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('takeout')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>外帶餐盒</span>
                                    {sortField === 'takeout' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('approved_disposable')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>簽准免洗餐盒</span>
                                    {sortField === 'approved_disposable' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap cursor-pointer hover:bg-muted select-none"
                                onClick={() => handleSort('cannot_comply_reason')}
                            >
                                <div className="flex items-center gap-1">
                                    <span>無法配合原因</span>
                                    {sortField === 'cannot_comply_reason' && (
                                        <span className="text-primary">
                                            {sortOrder === 'asc' ? '↑' : '↓'}
                                        </span>
                                    )}
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                        {getSortedBookings().length > 0 ? (
                            getSortedBookings().map((booking) => (
                                <tr key={booking.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                                        <div>
                                            {(() => {
                                                const date = new Date(booking.start_time)
                                                const year = date.getFullYear()
                                                const month = String(date.getMonth() + 1).padStart(2, '0')
                                                const day = String(date.getDate()).padStart(2, '0')
                                                return `${year}/${month}/${day}`
                                            })()}
                                        </div>
                                        <div className="text-muted-foreground text-xs">
                                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} -
                                            {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
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
                                        {booking.category && (
                                            <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary text-primary-foreground mt-1">
                                                {booking.category}
                                            </div>
                                        )}
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
                                    {hasSearched ? '此日期區間無預約紀錄' : ''}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    )
}
