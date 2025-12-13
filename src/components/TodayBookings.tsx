'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { BookingWithRoom, Room } from '@/types'
import BookingForm from './BookingForm'
import { updateBooking, deleteBooking } from '@/app/actions/bookings'

type Unit = {
    id: string
    name: string
    unit_members: { id: string, name: string }[]
}

export default function TodayBookings({
    initialBookings,
    userId,
    rooms
}: {
    initialBookings?: BookingWithRoom[]
    userId?: string
    rooms?: Room[]
}) {
    const [currentDate] = useState(new Date())
    const [bookings, setBookings] = useState<BookingWithRoom[]>(initialBookings || [])
    const [loading, setLoading] = useState(false)
    const [editingBooking, setEditingBooking] = useState<BookingWithRoom | null>(null)
    const [units, setUnits] = useState<Unit[]>([])
    const [isAdmin, setIsAdmin] = useState(false)
    const isFirstRun = useRef(true)

    // Format date string similar to page.tsx
    // e.g. 2025年12月8日 星期一
    const dateStr = currentDate.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })

    useEffect(() => {
        const fetchBookings = async (date: Date) => {
            setLoading(true)
            const supabase = createClient()

            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)

            const endOfDay = new Date(date)
            endOfDay.setHours(23, 59, 59, 999)

            const { data } = await supabase
                .from('bookings')
                .select('*, rooms(*), units(*)')
                .gte('start_time', startOfDay.toISOString())
                .lt('start_time', endOfDay.toISOString())
                .order('start_time')

            if (data) {
                setBookings(data as unknown as BookingWithRoom[])
            }
            setLoading(false)
        }

        // Skip the first fetch if we have initial data and the date hasn't changed from "today"
        if (initialBookings && isFirstRun.current) {
            isFirstRun.current = false
            return
        }
        fetchBookings(currentDate)
    }, [currentDate, initialBookings])

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
        const checkAdmin = async () => {
            if (!userId) return
            const supabase = createClient()
            const { data } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single()
            setIsAdmin(data?.role === 'admin')
        }
        checkAdmin()
    }, [userId])

    const handleUpdate = async (formData: FormData) => {
        if (!editingBooking) return

        try {
            // Get the date from form
            const bookingDateStr = formData.get('booking_date') as string
            const dateStr = bookingDateStr // Already in YYYY-MM-DD format

            // Combine date with time values from form
            const startTime = formData.get('start_time') as string
            const endTime = formData.get('end_time') as string
            const startDateTime = `${dateStr}T${startTime}:00`
            const endDateTime = `${dateStr}T${endTime}:00`

            const updateData = {
                title: formData.get('title') as string,
                start_time: startDateTime,
                end_time: endDateTime,
                notes: formData.get('notes') as string || null,
                category: formData.get('category') as string || '會議',
                eco_box_count: parseInt(formData.get('eco_box_count') as string) || 0,
                no_packaging_count: parseInt(formData.get('no_packaging_count') as string) || 0,
                takeout_count: parseInt(formData.get('takeout_count') as string) || 0,
                cannot_comply_reason: formData.get('cannot_comply_reason') as string || '無提供便當',
                approved_disposable_count: parseInt(formData.get('approved_disposable_count') as string) || 0,
                unit_id: formData.get('unit_id') as string,
                unit_member_id: formData.get('unit_member_id') as string,
                room_id: formData.get('room_id') as string,
            }

            await updateBooking(editingBooking.id, updateData)
            setEditingBooking(null)

            // Refresh bookings after update
            const supabase = createClient()
            const startOfDay = new Date(currentDate)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(currentDate)
            endOfDay.setHours(23, 59, 59, 999)

            const { data } = await supabase
                .from('bookings')
                .select('*, rooms(*), units(*)')
                .gte('start_time', startOfDay.toISOString())
                .lt('start_time', endOfDay.toISOString())
                .order('start_time')

            if (data) {
                setBookings(data as unknown as BookingWithRoom[])
            }

            alert('更新成功！')
        } catch (error) {
            const errorMessage = (error as Error).message
            if (errorMessage.includes('conflicting key value violates exclusion constraint "no_overlap"')) {
                alert('更新預約失敗:同時段已有登記')
            } else if (errorMessage.includes('bookings_time_check')) {
                alert('更新預約失敗: 結束時間必須晚於開始時間')
            } else {
                alert('更新預約失敗: ' + errorMessage)
            }
            throw error
        }
    }

    const handleDelete = async () => {
        if (!editingBooking) return

        try {
            await deleteBooking(editingBooking.id)
            setEditingBooking(null)

            // Refresh bookings after delete
            const supabase = createClient()
            const startOfDay = new Date(currentDate)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(currentDate)
            endOfDay.setHours(23, 59, 59, 999)

            const { data } = await supabase
                .from('bookings')
                .select('*, rooms(*), units(*)')
                .gte('start_time', startOfDay.toISOString())
                .lt('start_time', endOfDay.toISOString())
                .order('start_time')

            if (data) {
                setBookings(data as unknown as BookingWithRoom[])
            }

            alert('刪除成功！')
        } catch (error) {
            alert('刪除失敗: ' + (error as Error).message)
        }
    }

    // Check if booking is read-only (not user's own booking and not admin)
    const isReadOnly = Boolean(editingBooking && userId && editingBooking.user_id !== userId && !isAdmin)

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

            <div>
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">載入中...</div>
                ) : (!bookings || bookings.length === 0) ? (
                    <div className="text-center py-8 text-muted-foreground">
                        本日無會議
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {bookings.map((booking) => {
                            const startTime = new Date(booking.start_time)
                            const endTime = new Date(booking.end_time)
                            const isMyBooking = userId && booking.user_id === userId

                            return (
                                <div
                                    key={booking.id}
                                    onClick={() => setEditingBooking(booking)}
                                    className="group relative flex flex-col gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm transition-all hover:shadow-md cursor-pointer border-border/50 hover:border-primary/50"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="font-semibold text-lg text-primary tracking-tight">
                                            {booking.rooms?.name || '未知會議室'}
                                        </div>
                                        {isMyBooking && (
                                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary border border-primary/20 shrink-0">
                                                您的預約
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <div className="text-base font-medium text-foreground line-clamp-2">
                                            {booking.title}
                                        </div>

                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                            <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>
                                                {startTime.toLocaleDateString('zh-TW', { month: '2-digit', day: '2-digit' })} ({['日', '一', '二', '三', '四', '五', '六'][startTime.getDay()]})
                                            </span>
                                            <span className="mx-1 text-border">|</span>
                                            <span>
                                                {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })} - {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                            <svg className="h-4 w-4 shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                            <span>{booking.units?.name || '未知單位'}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            <BookingForm
                isOpen={!!editingBooking}
                onClose={() => setEditingBooking(null)}
                onSubmit={handleUpdate}
                onDelete={handleDelete}
                initialData={editingBooking}
                rooms={rooms || []}
                units={units}
                selectedDate={editingBooking ? new Date(editingBooking.start_time) : null}
                isReadOnly={isReadOnly}
            />
        </div>
    )
}
