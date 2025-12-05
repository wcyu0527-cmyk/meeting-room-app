'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Booking, Room, BookingWithRoom } from '@/types'

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
            return isSameDay(bookingDate, date)
        })
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

        // Combine date and time
        if (!selectedDate) return

        const startDateTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${startTimeStr}`)
        const endDateTime = new Date(`${selectedDate.toISOString().split('T')[0]}T${endTimeStr}`)

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            alert('請先登入')
            setIsSubmitting(false)
            return
        }

        const { error } = await supabase.from('bookings').insert({
            room_id: roomId,
            user_id: user.id,
            title,
            start_time: startDateTime.toISOString(),
            end_time: endDateTime.toISOString(),
            notes: notes || null,
        })

        if (error) {
            alert('預約失敗: ' + error.message)
        } else {
            alert('預約成功！')
            setIsBookingModalOpen(false)
            fetchMonthBookings(currentDate) // Refresh bookings
        }
        setIsSubmitting(false)
    }

    const selectedDayBookings = selectedDate ? getDayBookings(selectedDate) : []

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="text-lg font-semibold text-foreground">
                    {formatDate(currentDate)}
                </h2>
                <div className="flex space-x-1">
                    <button
                        onClick={() => {
                            const today = new Date()
                            setCurrentDate(today)
                            setSelectedDate(today)
                        }}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-2 mr-1"
                    >
                        今日
                    </button>
                    <button
                        onClick={() => changeMonth(-1)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 w-8"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={() => changeMonth(1)}
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
                            if (!date) return <div key={`empty-${index}`} className="h-24 md:h-32 bg-muted/20 rounded-lg" />

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
                                        relative h-24 md:h-32 p-2 rounded-lg border transition-all text-left group
                                        ${isSelected
                                            ? 'ring-2 ring-primary border-transparent bg-accent'
                                            : 'border-border hover:border-primary/50 hover:shadow-sm bg-card'
                                        }
                                    `}
                                >
                                    <span className={`
                                        inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium
                                        ${isToday
                                            ? 'bg-primary text-primary-foreground'
                                            : isSelected ? 'text-primary' : 'text-foreground'
                                        }
                                    `}>
                                        {date.getDate()}
                                    </span>

                                    {/* Booking Indicators */}
                                    <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100%-2rem)] scrollbar-hide">
                                        {dayBookings.slice(0, 3).map(booking => (
                                            <div
                                                key={booking.id}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate border border-primary/20"
                                            >
                                                {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        ))}
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
                    <div className="w-full md:w-80 border-l border-border bg-card p-4 overflow-y-auto max-h-[600px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-foreground">
                                {selectedDate.toLocaleDateString('zh-TW', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h3>
                        </div>

                        {selectedDayBookings.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDayBookings.map(booking => (
                                    <div key={booking.id} className="bg-card p-3 rounded-lg shadow-sm border border-border">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                {(booking.rooms as unknown as Room)?.name || '會議室'}
                                            </span>
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
                                ))}
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
            {isBookingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6 border border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            預約會議 - {selectedDate?.toLocaleDateString('zh-TW')}
                        </h3>
                        <form onSubmit={handleBookRoom} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    會議室
                                </label>
                                <select
                                    name="room_id"
                                    required
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
                                    placeholder="例如：週會"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
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
                                        defaultValue="09:00"
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
                                        defaultValue="10:00"
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
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsBookingModalOpen(false)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                                >
                                    {isSubmitting ? '預約中...' : '確認預約'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
