'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Room, BookingWithRoom } from '@/types'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import BookingForm from './BookingForm'

type CalendarProps = {
    initialBookings: BookingWithRoom[]
    rooms: Room[]
    userUnitId?: string
}

export default function MonthCalendar({ initialBookings, rooms, userUnitId }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [bookings, setBookings] = useState<BookingWithRoom[]>(initialBookings)
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [user, setUser] = useState<User | null>(null)
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
                const sortedUnits = data.map((unit: unknown) => ({
                    ...(unit as { id: string, name: string, unit_members: { id: string, name: string }[] }),
                    unit_members: (unit as { unit_members: { id: string, name: string }[] }).unit_members.sort((a, b) => a.name.localeCompare(b.name))
                }))
                setUnits(sortedUnits)
            }
        }
        fetchUnits()
    }, [])

    useEffect(() => {
        if (editingBooking) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setSelectedUnitId(editingBooking.unit_id || '')
            setSelectedMemberId(editingBooking.unit_member_id || '')
            setCannotComplyReason(editingBooking.cannot_comply_reason || '無提供便當')
        } else {
            setSelectedUnitId('')
            setSelectedMemberId('')
            setCannotComplyReason('無提供便當')
        }
    }, [editingBooking])

    const selectedUnit = units.find(u => u.id === selectedUnitId)

    const checkAdmin = async (userId: string) => {
        const supabase = createClient()
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single()
        setIsAdmin(data?.role === 'admin')
    }

    useEffect(() => {
        const supabase = createClient()
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user)
            if (user) {
                checkAdmin(user.id)
            }
        })
    }, [])

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



    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
    }

    // Fetch bookings when month changes
    const fetchMonthBookings = async (date: Date) => {
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
        if (!editingBooking) return

        const supabase = createClient()
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', editingBooking.id)

        if (error) {
            throw new Error(error.message)
        } else {
            alert('刪除成功！')
            fetchMonthBookings(currentDate)
            router.refresh()
        }
    }

    const handleBookRoom = async (formData: FormData) => {
        setIsSubmitting(true)

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

        // Combine date and time
        // 編輯模式：使用原始預約的日期；新增模式：使用選擇的日期
        const dateToUse = editingBooking ? new Date(editingBooking.start_time) : selectedDate
        if (!dateToUse) return

        const year = dateToUse.getFullYear()
        const month = String(dateToUse.getMonth() + 1).padStart(2, '0')
        const day = String(dateToUse.getDate()).padStart(2, '0')
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

        // Get unit_id and unit_member_id from formData directly, as BookingForm manages the state
        const unitId = formData.get('unit_id') as string
        const rawUnitMemberId = formData.get('unit_member_id') as string
        const customUnitMemberName = formData.get('custom_unit_member_name') as string

        let finalUnitMemberId: string | null = null
        let finalCustomUnitMemberName: string | null = null

        if (rawUnitMemberId === 'other') {
            finalCustomUnitMemberName = customUnitMemberName
        } else {
            finalUnitMemberId = rawUnitMemberId || null
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
                    unit_id: unitId || null,
                    unit_member_id: finalUnitMemberId,
                    custom_unit_member_name: finalCustomUnitMemberName,
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
                    unit_id: unitId || null,
                    unit_member_id: finalUnitMemberId,
                    custom_unit_member_name: finalCustomUnitMemberName,
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
            throw error // Re-throw to let BookingForm know
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
    // 3. If it's expired and user is admin -> can edit everything
    const isReadOnly = Boolean(editingBooking && user && editingBooking.user_id !== user.id && !isAdmin)
    const isEcoOnlyEditable = false

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
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-b border-border gap-4 sm:gap-0">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => changeMonth(-1)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-1">
                        <select
                            value={currentDate.getFullYear()}
                            onChange={(e) => {
                                const newYear = parseInt(e.target.value)
                                const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
                                newDate.setFullYear(newYear)
                                setCurrentDate(newDate)
                                fetchMonthBookings(newDate)
                            }}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                        >
                            {Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
                                <option key={year} value={year}>{year}年</option>
                            ))}
                        </select>
                        <select
                            value={currentDate.getMonth()}
                            onChange={(e) => {
                                const newMonth = parseInt(e.target.value)
                                const newDate = new Date(currentDate.getFullYear(), newMonth, 1)
                                setCurrentDate(newDate)
                                fetchMonthBookings(newDate)
                            }}
                            className="h-8 rounded-md border border-input bg-background px-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                        >
                            {Array.from({ length: 12 }, (_, i) => i).map(month => (
                                <option key={month} value={month}>{month + 1}月</option>
                            ))}
                        </select>
                    </div>
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
                                                {isMyBooking ? (
                                                    <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                        您的預約
                                                    </span>
                                                ) : (
                                                    booking.unit_id && (
                                                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                            {units.find(u => u.id === booking.unit_id)?.name || '未知單位'}
                                                        </span>
                                                    )
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
            <BookingForm
                isOpen={isBookingModalOpen}
                onClose={() => {
                    setIsBookingModalOpen(false)
                    setEditingBooking(null)
                }}
                onSubmit={handleBookRoom}
                onDelete={handleDeleteBooking}
                initialData={editingBooking}
                rooms={rooms}
                units={units}
                selectedDate={selectedDate}
                isReadOnly={isReadOnly}
                isEcoOnlyEditable={isEcoOnlyEditable}
                userUnitId={userUnitId}
            />
        </div >
    )
}
