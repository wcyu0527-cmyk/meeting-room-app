'use client'

import { useState, useEffect } from 'react'
import { deleteBooking, updateBooking } from '@/app/actions/bookings'
import { Booking, Room } from '@/types'
import BookingForm from './BookingForm'
import { createClient } from '@/utils/supabase/client'

type BookingWithRoom = Booking & {
    rooms: Room
}

type Unit = {
    id: string
    name: string
    unit_members: { id: string, name: string }[]
}

export default function MyBookings({
    bookings,
    userId,
    rooms,
    isAdmin
}: {
    bookings: BookingWithRoom[]
    userId: string
    rooms: Room[]
    isAdmin: boolean
}) {
    const [editingBooking, setEditingBooking] = useState<BookingWithRoom | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [units, setUnits] = useState<Unit[]>([])

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

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                您目前沒有預約
            </div>
        )
    }

    const handleDelete = async (bookingId: string, skipConfirm = false) => {
        if (!skipConfirm && !confirm('請確認是否刪除?')) {
            return
        }

        setIsDeleting(bookingId)
        try {
            await deleteBooking(bookingId)
        } catch (error) {
            alert('刪除預約失敗: ' + (error as Error).message)
        } finally {
            setIsDeleting(null)
        }
    }

    const handleUpdate = async (formData: FormData) => {
        if (!editingBooking) return

        try {
            // Get the original booking date
            const bookingDate = new Date(editingBooking.start_time)
            const year = bookingDate.getFullYear()
            const month = String(bookingDate.getMonth() + 1).padStart(2, '0')
            const day = String(bookingDate.getDate()).padStart(2, '0')
            const dateStr = `${year}-${month}-${day}`

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
            throw error // Re-throw to let BookingForm know it failed
        }
    }

    // Extract unique rooms from bookings for the form (though editing usually doesn't allow changing room in MyBookings, 
    // but BookingForm has room select. We can pass all unique rooms found in bookings, or we might need to fetch all rooms if we want to allow changing room.
    // The original MyBookings disabled room input. BookingForm has it enabled unless isReadOnly.
    // If we want to keep it disabled or restricted, we can pass only the current room or handle it.
    // However, the user said "Use the Month Meeting interface", which allows selecting room.
    // But for "My Bookings", maybe they want to change room too?
    // Let's assume they want the full capability. But we need the list of ALL rooms.
    // MyBookings props only has bookings. We don't have all rooms.
    // We might need to fetch rooms too or just pass the room from the booking as the only option.
    // Let's fetch rooms too to be safe and fully functional.

    // Wait, I can't easily fetch rooms inside the component without adding more state/effects.
    // But `bookings` contains `rooms` info.
    // If I only pass the room of the current booking, they can't change room.
    // Let's check if `MonthCalendar` passes `rooms`. Yes.
    // `MyBookings` page should probably pass `rooms` too.
    // But I can't change the page component easily without checking it.
    // Let's check `src/app/my-bookings/page.tsx`.

    return (
        <>
            <div className="space-y-8">
                {/* Section: Today */}
                {(() => {
                    const todayBookings = bookings.filter(booking => {
                        const bookingDate = new Date(booking.start_time)
                        const today = new Date()
                        return bookingDate.getDate() === today.getDate() &&
                            bookingDate.getMonth() === today.getMonth() &&
                            bookingDate.getFullYear() === today.getFullYear()
                    })

                    if (todayBookings.length === 0) return null

                    return (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <span className="w-2 h-8 bg-primary rounded-full"></span>
                                今日
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {todayBookings.map(booking => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        statusLabel="今日"
                                        statusColor="bg-primary text-primary-foreground"
                                        onEdit={() => setEditingBooking(booking)}
                                        onDelete={() => handleDelete(booking.id)}
                                        isDeleting={isDeleting === booking.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })()}

                {/* Section: Not Started (Upcoming) */}
                {(() => {
                    const upcomingBookings = bookings.filter(booking => {
                        const bookingDate = new Date(booking.start_time)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return bookingDate > today && (
                            bookingDate.getDate() !== today.getDate() ||
                            bookingDate.getMonth() !== today.getMonth() ||
                            bookingDate.getFullYear() !== today.getFullYear()
                        )
                    })

                    if (upcomingBookings.length === 0) return null

                    return (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                尚未開始
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {upcomingBookings.map(booking => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        statusLabel="尚未開始"
                                        statusColor="bg-blue-100 text-blue-700 border-blue-200"
                                        onEdit={() => setEditingBooking(booking)}
                                        onDelete={() => handleDelete(booking.id)}
                                        isDeleting={isDeleting === booking.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })()}

                {/* Section: Completed (Past) */}
                {(() => {
                    const pastBookings = bookings.filter(booking => {
                        const bookingDate = new Date(booking.start_time)
                        const today = new Date()
                        today.setHours(0, 0, 0, 0)
                        return bookingDate < today
                    })

                    if (pastBookings.length === 0) return null

                    return (
                        <div className="space-y-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <span className="w-2 h-8 bg-gray-400 rounded-full"></span>
                                已結束
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pastBookings.map(booking => (
                                    <BookingCard
                                        key={booking.id}
                                        booking={booking}
                                        statusLabel="已結束"
                                        statusColor="bg-gray-100 text-gray-600 border-gray-200"
                                        isExpired={true}
                                        onEdit={() => setEditingBooking(booking)}
                                        onDelete={() => handleDelete(booking.id)}
                                        isDeleting={isDeleting === booking.id}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })()}
            </div>

            <BookingForm
                isOpen={!!editingBooking}
                onClose={() => setEditingBooking(null)}
                onSubmit={handleUpdate}
                onDelete={async () => {
                    if (editingBooking) {
                        await handleDelete(editingBooking.id, true)
                    }
                }}
                initialData={editingBooking}
                rooms={rooms}
                units={units}
                selectedDate={editingBooking ? new Date(editingBooking.start_time) : null}
                isReadOnly={false}
            />
        </>
    )
}

function BookingCard({
    booking,
    statusLabel,
    statusColor,
    onEdit,
    onDelete,
    isDeleting,
    isExpired = false
}: {
    booking: BookingWithRoom
    statusLabel: string
    statusColor: string
    onEdit: () => void
    onDelete: () => void
    isDeleting: boolean
    isExpired?: boolean
}) {
    const startTime = new Date(booking.start_time)
    const endTime = new Date(booking.end_time)

    return (
        <div
            className={`
                relative flex flex-col justify-between rounded-lg border p-4 shadow-sm transition-all hover:shadow-md
                ${isExpired ? 'bg-muted/50 opacity-75' : 'bg-card text-card-foreground'}
            `}
        >
            <div className="space-y-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="font-semibold text-lg">
                            {startTime.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })} - {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                        </div>
                    </div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${statusColor}`}>
                        {statusLabel}
                    </span>
                </div>

                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="inline-flex items-center justify-center rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                            {booking.rooms.name}
                        </span>
                    </div>
                    <h3 className="font-medium leading-none tracking-tight">
                        {booking.title}
                    </h3>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 pt-4 border-t border-border">
                <button
                    onClick={onEdit}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                >
                    編輯
                </button>
                <button
                    onClick={onDelete}
                    disabled={isDeleting}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3"
                >
                    {isDeleting ? '刪除中...' : '刪除'}
                </button>
            </div>
        </div>
    )
}
