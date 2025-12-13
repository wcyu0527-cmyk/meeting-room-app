'use client'

import { useState, useEffect } from 'react'
import { BookingWithRoom, Room } from '@/types'
import BookingForm from './BookingForm'
import { createClient } from '@/utils/supabase/client'
import { updateBooking, deleteBooking } from '@/app/actions/bookings'

type Unit = {
    id: string
    name: string
    unit_members: { id: string, name: string }[]
}

export default function AllBookings({
    bookings,
    rooms,
    userId
}: {
    bookings: BookingWithRoom[]
    rooms: Room[]
    userId?: string
}) {
    const [editingBooking, setEditingBooking] = useState<BookingWithRoom | null>(null)
    const [units, setUnits] = useState<Unit[]>([])
    const [isAdmin, setIsAdmin] = useState(false)

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

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                暫無預約
            </div>
        )
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
            throw error
        }
    }

    const handleDelete = async () => {
        if (!editingBooking) return

        try {
            await deleteBooking(editingBooking.id)
            setEditingBooking(null)
            alert('刪除成功！')
        } catch (error) {
            alert('刪除失敗: ' + (error as Error).message)
        }
    }

    // Check if booking is read-only (not user's own booking and not admin)
    const isReadOnly = Boolean(editingBooking && userId && editingBooking.user_id !== userId && !isAdmin)

    return (
        <>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-xl">
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
                                會議名稱
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

                            return (
                                <tr
                                    key={booking.id}
                                    onClick={() => setEditingBooking(booking)}
                                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                                >
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

            <BookingForm
                isOpen={!!editingBooking}
                onClose={() => setEditingBooking(null)}
                onSubmit={handleUpdate}
                onDelete={handleDelete}
                initialData={editingBooking}
                rooms={rooms}
                units={units}
                selectedDate={editingBooking ? new Date(editingBooking.start_time) : null}
                isReadOnly={isReadOnly}
            />
        </>
    )
}
