'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Booking, Room, BookingWithRoom } from '@/types'
import { useRouter } from 'next/navigation'

type CalendarProps = {
    initialBookings: BookingWithRoom[]
    rooms: Room[]
}

export default function MonthCalendar({ initialBookings, rooms }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [bookings, setBookings] = useState<BookingWithRoom[]>(initialBookings)
    const [loading, setLoading] = useState(false)
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [user, setUser] = useState<any>(null)
    const [editingBooking, setEditingBooking] = useState<BookingWithRoom | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)
    const [filterTags, setFilterTags] = useState<string[]>(['所有'])
    const [units, setUnits] = useState<{ id: string, name: string, unit_members: { id: string, name: string }[] }[]>([])
    const [selectedUnitId, setSelectedUnitId] = useState('')
    const [selectedMemberId, setSelectedMemberId] = useState('')
    const [cannotComplyReason, setCannotComplyReason] = useState('無提供便當')

    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)
    const [isCompact, setIsCompact] = useState(false)

    useEffect(() => {
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setIsCompact(entry.contentRect.width < 768)
            }
        })
        if (containerRef.current) {
            observer.observe(containerRef.current)
        }
        return () => observer.disconnect()
    }, [])

    useEffect(() => {
        const fetchUnits = async () => {
            const supabase = createClient()
            const { data } = await supabase
                .from('units')
                .select(`
                    id, 
                    name, 
                    unit_members (
                        id, 
                        name
                    )
                `)
                .order('name')

            if (data) {
                const sortedUnits = data.map((unit: any) => ({
                    ...unit,
                    unit_members: unit.unit_members.sort((a: any, b: any) => a.name.localeCompare(b.name))
                }))
                setUnits(sortedUnits)
            }
        }
        fetchUnits()
    }, [])

    useEffect(() => {
        if (editingBooking) {
            setSelectedUnitId((editingBooking as any).unit_id || '')
            setSelectedMemberId((editingBooking as any).unit_member_id || '')
            setCannotComplyReason((editingBooking as any).cannot_comply_reason || '無提供便當')
        } else {
            setSelectedUnitId('')
            setSelectedMemberId('')
            setCannotComplyReason('無提供便當')
        }
    }, [editingBooking])

    const selectedUnit = units.find(u => u.id === selectedUnitId)

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            if (user) {
                checkAdmin(user.id)
            }
        })
    }, [])

    const checkAdmin = async (userId: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('users')
            .select('is_admin')
            .eq('id', userId)
            .single()
        setIsAdmin(data?.is_admin ?? false)
    }

    // Calendar logic helpers
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month + 1, 0).getDate()
    }

    const getFirstDayOfMonth = (date: Date) => {
        const year = date.getFullYear()
        const month = date.getMonth()
        return new Date(year, month, 1).getDay()
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'long',
        })
    }

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
    }

    // Fetch bookings when month changes
    const fetchMonthBookings = async (date: Date) => {
        setLoading(true)
        const supabase = createClient()

        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59)

        const { data, error } = await supabase
            .from('bookings')
            .select('*, rooms(*)')
            .gte('start_time', startOfMonth.toISOString())
            .lte('end_time', endOfMonth.toISOString())

        if (!error && data) {
            setBookings(data as unknown as BookingWithRoom[])
        }
        setLoading(false)
    }

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)
        setCurrentDate(newDate)
        fetchMonthBookings(newDate)
        setSelectedDate(null)
    }

    const changeSelectedDate = (offset: number) => {
        const newDate = new Date(selectedDate || new Date())
        newDate.setDate(newDate.getDate() + offset)
        setSelectedDate(newDate)

        // If the new date is in a different month, switch the calendar view
        if (newDate.getMonth() !== currentDate.getMonth() || newDate.getFullYear() !== currentDate.getFullYear()) {
            const newMonthDate = new Date(newDate.getFullYear(), newDate.getMonth(), 1)
            setCurrentDate(newMonthDate)
            fetchMonthBookings(newMonthDate)
        }
    }

    // Generate calendar grid
    const daysInMonth = getDaysInMonth(currentDate)
    const firstDay = getFirstDayOfMonth(currentDate)
    const days = []

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
        days.push(null)
    }

    // Days of current month
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
    }

    // Get bookings for a specific day
    const getDayBookings = (date: Date) => {
        return bookings.filter(booking => {
            const bookingDate = new Date(booking.start_time)
            const isSameDate = isSameDay(bookingDate, date)
            if (!isSameDate) return false

            if (!isSameDate) return false

            if (!filterTags.includes('所有')) {
                const roomName = (booking.rooms as unknown as Room)?.name || ''
                if (!filterTags.some(tag => roomName.includes(tag))) return false
            }
            return true
        })
    }

    const toggleTag = (tag: string) => {
        if (tag === '所有') {
            setFilterTags(['所有'])
            return
        }

        let newTags: string[]
        if (filterTags.includes('所有')) {
            newTags = [tag]
        } else {
            if (filterTags.includes(tag)) {
                newTags = filterTags.filter(t => t !== tag)
            } else {
                newTags = [...filterTags, tag]
            }
        }

        if (newTags.length === 0) {
            setFilterTags(['所有'])
        } else {
            setFilterTags(newTags)
        }
    }

    const handleDeleteBooking = async () => {
        if (!editingBooking || !confirm('確定要刪除此預約嗎？')) return

        setIsSubmitting(true)
        const supabase = createClient()
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', editingBooking.id)

        if (error) {
            alert('刪除失敗: ' + error.message)
        } else {
            alert('刪除成功！')
            setIsBookingModalOpen(false)
            setEditingBooking(null)
            fetchMonthBookings(currentDate)
            router.refresh()
        }
        setIsSubmitting(false)
    }

    const handleBookRoom = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const roomId = formData.get('room_id') as string
        const title = formData.get('title') as string
        const startTimeStr = formData.get('start_time') as string
        const endTimeStr = formData.get('end_time') as string
        const notes = formData.get('notes') as string

        // 環保相關欄位
        const category = formData.get('category') as string
        const ecoBoxCount = parseInt(formData.get('eco_box_count') as string) || 0
        const noPackagingCount = parseInt(formData.get('no_packaging_count') as string) || 0
        const takeoutCount = parseInt(formData.get('takeout_count') as string) || 0
        const cannotComplyReasonValue = formData.get('cannot_comply_reason') as string
        const approvedDisposableCount = parseInt(formData.get('approved_disposable_count') as string) || 0

        // 驗證：如果選擇"因其他原因無法配合"，備註必填
        if (cannotComplyReasonValue === '因其他原因無法配合' && !notes.trim()) {
            alert('選擇「因其他原因無法配合」時，請在備註中說明原因')
            setIsSubmitting(false)
            return
        }

        // Combine date and time
        if (!selectedDate) return

        const year = selectedDate.getFullYear()
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
        const day = String(selectedDate.getDate()).padStart(2, '0')
        const dateStr = `${year}-${month}-${day}`

        const startDateTime = new Date(`${dateStr}T${startTimeStr}`)
        const endDateTime = new Date(`${dateStr}T${endTimeStr}`)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert('請先登入')
            setIsSubmitting(false)
            return
        }

        let error
        if (editingBooking) {
            const { error: updateError } = await supabase
                .from('bookings')
                .update({
                    room_id: roomId,
                    title,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    notes: notes || null,
                    unit_id: selectedUnitId || null,
                    unit_member_id: selectedMemberId || null,
                    category: category || '會議',
                    eco_box_count: ecoBoxCount,
                    no_packaging_count: noPackagingCount,
                    takeout_count: takeoutCount,
                    cannot_comply_reason: cannotComplyReasonValue || '無提供便當',
                    approved_disposable_count: approvedDisposableCount
                })
                .eq('id', editingBooking.id)
            error = updateError
        } else {
            const { error: insertError } = await supabase
                .from('bookings')
                .insert({
                    room_id: roomId,
                    user_id: user.id,
                    title,
                    start_time: startDateTime.toISOString(),
                    end_time: endDateTime.toISOString(),
                    notes: notes || null,
                    unit_id: selectedUnitId || null,
                    unit_member_id: selectedMemberId || null,
                    category: category || '會議',
                    eco_box_count: ecoBoxCount,
                    no_packaging_count: noPackagingCount,
                    takeout_count: takeoutCount,
                    cannot_comply_reason: cannotComplyReasonValue || '無提供便當',
                    approved_disposable_count: approvedDisposableCount
                })
            error = insertError
        }

        if (error) {
            alert((editingBooking ? '更新' : '預約') + '失敗: ' + error.message)
        } else {
            alert((editingBooking ? '更新' : '預約') + '成功！')
            setIsBookingModalOpen(false)
            setEditingBooking(null)
            fetchMonthBookings(currentDate) // Refresh bookings
            router.refresh()
        }
        setIsSubmitting(false)
    }

    const selectedDayBookings = selectedDate ? getDayBookings(selectedDate) : []

    // Check if booking is read-only or eco-only editable
    // 1. If it's someone else's booking -> fully read-only
    // 2. If it's expired and user's own booking -> can edit eco fields only
    // 3. If it's expired and user is admin -> can edit everything
    const isExpired = editingBooking ? new Date(editingBooking.end_time) < new Date() : false
    const isOwnBooking = editingBooking && user && editingBooking.user_id === user.id
    const isReadOnly = editingBooking && user && editingBooking.user_id !== user.id
    const isEcoOnlyEditable = isOwnBooking && isExpired && !isAdmin

    return (
        <div ref={containerRef} className="rounded-xl border bg-card text-card-foreground shadow">
            {/* Main Title & Filter Tags */}
            <div className="flex flex-wrap items-center px-6 py-4 border-b border-border gap-x-6 gap-y-3">
                <h2 className="text-xl font-bold tracking-tight text-foreground whitespace-nowrap">
                    本月會議
                </h2>
                <div className="flex flex-wrap gap-2 items-center">
                    {['所有', '大會議室', '小會議室', '舊辦'].map(tag => (
                        <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${filterTags.includes(tag)
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>

            {/* Calendar Navigation Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h2 className="text-lg font-semibold text-foreground min-w-[100px] text-center">
                        {formatDate(currentDate)}
                    </h2>
                    <button
                        onClick={() => changeMonth(1)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => changeSelectedDate(-1)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => {
                            const today = new Date()
                            setCurrentDate(today)
                            setSelectedDate(today)
                        }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                    >
                        今日
                    </button>
                    <button
                        onClick={() => changeSelectedDate(1)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row">
                {/* Calendar Grid */}
                <div className="flex-1 p-4">
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {day}
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {days.map((date, index) => {
                            if (!date) return <div key={`empty-${index}`} className="min-h-[3.5rem] md:h-32 bg-muted/20 rounded-lg" />

                            const dayBookings = getDayBookings(date)
                            const isSelected = selectedDate && isSameDay(date, selectedDate)
                            const isToday = isSameDay(date, new Date())

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => {
                                        setSelectedDate(date)
                                        setIsBookingModalOpen(true)
                                    }}
                                    className={`
                                        relative min-h-[3.5rem] ${isCompact ? '' : 'h-32'} p-1 ${isCompact ? '' : 'p-2'} rounded-lg border transition-all text-left group flex flex-col ${isCompact ? 'items-center' : 'items-start'}
                                        ${isSelected
                                            ? 'ring-2 ring-primary border-transparent bg-accent'
                                            : 'border-border hover:border-primary/50 hover:shadow-sm bg-card'
                                        }
                                    `}
                                >
                                    <span className={`
                                        inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-xs md:text-sm font-medium
                                        ${isToday
                                            ? 'bg-primary text-primary-foreground'
                                            : isSelected ? 'text-primary' : 'text-foreground'
                                        }
                                    `}>
                                        {date.getDate()}
                                    </span>

                                    {/* Mobile: Dots Indicators */}
                                    <div className={`mt-1 flex flex-wrap gap-0.5 justify-center content-center w-full px-0.5 ${isCompact ? 'flex' : 'hidden'}`}>
                                        {dayBookings.slice(0, 6).map(booking => {
                                            const isMyBooking = user && booking.user_id === user.id
                                            return (
                                                <div
                                                    key={booking.id}
                                                    className={`w-1 h-1 rounded-full ${isMyBooking ? 'bg-primary' : 'bg-primary/40'}`}
                                                />
                                            )
                                        })}
                                        {dayBookings.length > 6 && (
                                            <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                        )}
                                    </div>

                                    {/* Desktop: Booking Text List */}
                                    <div className={`mt-2 w-full space-y-1 overflow-y-auto max-h-[calc(100%-2rem)] scrollbar-hide ${isCompact ? 'hidden' : 'block'}`}>
                                        {dayBookings.slice(0, 3).map(booking => {
                                            const isMyBooking = user && booking.user_id === user.id
                                            return (
                                                <div
                                                    key={booking.id}
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingBooking(booking)
                                                        setIsBookingModalOpen(true)
                                                    }}
                                                    className={`text-[10px] px-1.5 py-1 rounded border flex flex-col leading-tight cursor-pointer ${isMyBooking
                                                        ? 'bg-primary text-primary-foreground border-primary hover:opacity-90'
                                                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                                                        }`}
                                                >
                                                    <span className="font-semibold truncate">
                                                        {new Date(booking.start_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                                    </span>
                                                    <span className="truncate">
                                                        {booking.title}
                                                    </span>
                                                </div>
                                            )
                                        })}
                                        {dayBookings.length > 3 && (
                                            <div className="text-[10px] text-muted-foreground pl-1">
                                                +{dayBookings.length - 3} 更多
                                            </div>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Selected Day Details Panel */}
                {selectedDate && (
                    <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border bg-card p-4 overflow-y-auto max-h-[600px] rounded-b-xl md:rounded-b-none md:rounded-r-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-foreground">
                                {selectedDate.toLocaleDateString('zh-TW', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                        </div>

                        {selectedDayBookings.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayBookings.map(booking => {
                                    const isMyBooking = user && booking.user_id === user.id
                                    return (
                                        <div
                                            key={booking.id}
                                            onClick={() => {
                                                setEditingBooking(booking)
                                                setIsBookingModalOpen(true)
                                            }}
                                            className={`bg-card p-3 rounded-lg shadow-sm border transition-colors cursor-pointer ${isMyBooking
                                                ? 'border-primary/50 hover:bg-muted/50'
                                                : 'border-border hover:bg-muted/30'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                    {(booking.rooms as unknown as Room)?.name || '會議室'}
                                                </span>
                                                {isMyBooking && (
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        您的預約
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-sm font-medium text-foreground mb-1">
                                                {booking.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center">
                                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                {new Date(booking.start_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })} -
                                                {new Date(booking.end_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>本日無預約紀錄</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Booking Modal */}
            {
                isBookingModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-border">
                            <h3 className="text-lg font-semibold text-foreground mb-4">
                                {editingBooking ? (
                                    isReadOnly ? '預約詳情' :
                                        isEcoOnlyEditable ? '編輯預約（僅限環保資訊）' :
                                            '編輯預約'
                                ) : '預約會議'} - {selectedDate?.toLocaleDateString('zh-TW')}
                            </h3>
                            <form onSubmit={handleBookRoom} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        會議室
                                    </label>
                                    <select
                                        name="room_id"
                                        required
                                        disabled={isReadOnly || isEcoOnlyEditable}
                                        defaultValue={editingBooking?.room_id}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {rooms.map(room => (
                                            <option key={room.id} value={room.id}>
                                                {room.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        會議主題
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        required
                                        disabled={isReadOnly || isEcoOnlyEditable}
                                        defaultValue={editingBooking?.title}
                                        placeholder="例如：週會"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            登記單位
                                        </label>
                                        <select
                                            value={selectedUnitId}
                                            disabled={isReadOnly || isEcoOnlyEditable}
                                            onChange={(e) => {
                                                setSelectedUnitId(e.target.value)
                                                setSelectedMemberId('')
                                            }}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <option value="">請選擇單位</option>
                                            {units.map(unit => (
                                                <option key={unit.id} value={unit.id}>{unit.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            同仁姓名
                                        </label>
                                        <select
                                            value={selectedMemberId}
                                            onChange={(e) => setSelectedMemberId(e.target.value)}
                                            disabled={!selectedUnitId || isReadOnly || isEcoOnlyEditable}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                                        >
                                            <option value="">{selectedUnitId ? '請選擇同仁' : '請先選擇單位'}</option>
                                            {selectedUnit?.unit_members.map(member => (
                                                <option key={member.id} value={member.id}>{member.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            開始時間
                                        </label>
                                        <input
                                            type="time"
                                            name="start_time"
                                            required
                                            disabled={isReadOnly || isEcoOnlyEditable}
                                            defaultValue={editingBooking ? new Date(editingBooking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "09:00"}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            結束時間
                                        </label>
                                        <input
                                            type="time"
                                            name="end_time"
                                            required
                                            disabled={isReadOnly || isEcoOnlyEditable}
                                            defaultValue={editingBooking ? new Date(editingBooking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "10:00"}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        備註 (選填)
                                    </label>
                                    <textarea
                                        name="notes"
                                        rows={3}
                                        disabled={isReadOnly || isEcoOnlyEditable}
                                        defaultValue={editingBooking?.notes || ''}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>

                                {/* 免洗餐具及包裝飲用水減量 */}
                                <div className="border-t border-border pt-4 mt-4">
                                    <h4 className="text-sm font-semibold text-foreground mb-3">免洗餐具及包裝飲用水減量</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        {/* 類別 */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                類別
                                            </label>
                                            <select
                                                name="category"
                                                disabled={isReadOnly}
                                                defaultValue={(editingBooking as any)?.category || '會議'}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="會議">會議</option>
                                                <option value="訓練">訓練</option>
                                                <option value="活動">活動</option>
                                            </select>
                                        </div>

                                        {/* 本次使用環保餐盒數量 */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                本次使用環保餐盒數量
                                            </label>
                                            <input
                                                type="number"
                                                name="eco_box_count"
                                                min="0"
                                                disabled={isReadOnly}
                                                defaultValue={(editingBooking as any)?.eco_box_count || 0}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        {/* 本次不使用包裝水、紙杯人數 */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                本次不使用包裝水、紙杯人數
                                            </label>
                                            <input
                                                type="number"
                                                name="no_packaging_count"
                                                min="0"
                                                disabled={isReadOnly}
                                                defaultValue={(editingBooking as any)?.no_packaging_count || 0}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>

                                        {/* 外帶數量 */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                外帶數量
                                                <span className="text-xs text-muted-foreground ml-1">(便當以外，提供非塑膠包裝之餐點個數)</span>
                                            </label>
                                            <input
                                                type="number"
                                                name="takeout_count"
                                                min="0"
                                                disabled={isReadOnly}
                                                defaultValue={(editingBooking as any)?.takeout_count || 0}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        {/* 本次無法配合之主要原因 */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                本次無法配合之主要原因
                                            </label>
                                            <select
                                                name="cannot_comply_reason"
                                                disabled={isReadOnly}
                                                value={cannotComplyReason}
                                                onChange={(e) => setCannotComplyReason(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                <option value="無提供便當">無提供便當</option>
                                                <option value="因訂購數量無法配合">因訂購數量無法配合</option>
                                                <option value="因收送時間無法配合">因收送時間無法配合</option>
                                                <option value="因辦理地點無法配合">因辦理地點無法配合</option>
                                                <option value="因其他原因無法配合">因其他原因無法配合</option>
                                            </select>
                                            {cannotComplyReason === '因其他原因無法配合' && (
                                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                                    ⚠️ 請在備註欄位說明原因
                                                </p>
                                            )}
                                        </div>

                                        {/* 本次報准使用免洗餐盒數量 */}
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">
                                                本次報准使用免洗餐盒數量
                                            </label>
                                            <input
                                                type="number"
                                                name="approved_disposable_count"
                                                min="0"
                                                disabled={isReadOnly}
                                                defaultValue={(editingBooking as any)?.approved_disposable_count || 0}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between space-x-2 pt-2">
                                    {editingBooking && !isReadOnly && !isEcoOnlyEditable ? (
                                        <button
                                            type="button"
                                            onClick={handleDeleteBooking}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
                                        >
                                            刪除
                                        </button>
                                    ) : <div />}
                                    <div className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsBookingModalOpen(false)
                                                setEditingBooking(null)
                                            }}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                        >
                                            {isReadOnly ? '關閉' : '取消'}
                                        </button>
                                        {!isReadOnly && (
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                            >
                                                {isSubmitting ? (editingBooking ? '更新中...' : '預約中...') : (editingBooking ? '更新預約' : '確認預約')}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    )
}
