'use client'

import { useState } from 'react'
import { deleteBooking, updateBooking } from '@/app/actions/bookings'
import { Booking, Room } from '@/types'

type BookingWithRoom = Booking & {
    rooms: Room
}

export default function MyBookings({
    bookings,
    isAdmin
}: {
    bookings: BookingWithRoom[]
    userId: string
    isAdmin?: boolean
}) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({
        title: '',
        start_time: '',
        end_time: '',
    })
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                您目前沒有預約
            </div>
        )
    }

    const handleEdit = (booking: BookingWithRoom) => {
        setEditingId(booking.id)
        setEditForm({
            title: booking.title,
            start_time: new Date(booking.start_time).toISOString().slice(0, 16),
            end_time: new Date(booking.end_time).toISOString().slice(0, 16),
        })
    }

    const handleSave = async (bookingId: string) => {
        try {
            await updateBooking(
                bookingId,
                editForm.title,
                editForm.start_time,
                editForm.end_time
            )
            setEditingId(null)
        } catch (error) {
            alert('更新預約失敗: ' + (error as Error).message)
        }
    }

    const handleDelete = async (bookingId: string) => {
        if (!confirm('確定要刪除此預約嗎？')) {
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

    return (
        <div className="overflow-hidden shadow border border-border sm:rounded-lg">
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                            日期與時間
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            會議室
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            會議主題
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            操作
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {bookings.map((booking) => {
                        const isEditing = editingId === booking.id
                        const startTime = new Date(booking.start_time)
                        const endTime = new Date(booking.end_time)
                        const isPast = endTime < new Date()

                        return (
                            <tr key={booking.id} className={isPast ? 'bg-muted/50 opacity-75' : ''}>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <input
                                                type="datetime-local"
                                                value={editForm.start_time}
                                                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                                className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            />
                                            <input
                                                type="datetime-local"
                                                value={editForm.end_time}
                                                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                                className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-medium text-foreground">
                                                {startTime.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                {isPast && <span className="ml-2 text-xs text-muted-foreground">(已過期)</span>}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })} - {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </div>
                                        </>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                    {booking.rooms.name}
                                </td>
                                <td className="px-3 py-4 text-sm text-foreground">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="block w-full rounded-md border-input bg-background text-foreground shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                        />
                                    ) : (
                                        booking.title
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSave(booking.id)}
                                                className="text-primary hover:text-primary/80"
                                            >
                                                儲存
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="text-muted-foreground hover:text-foreground"
                                            >
                                                取消
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            {(isAdmin || !isPast) && (
                                                <>
                                                    <button
                                                        onClick={() => handleEdit(booking)}
                                                        className="text-primary hover:text-primary/80"
                                                    >
                                                        編輯
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(booking.id)}
                                                        disabled={isDeleting === booking.id}
                                                        className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                                                    >
                                                        {isDeleting === booking.id ? '刪除中...' : '刪除'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}
