'use client'

import { useState } from 'react'
import { deleteBooking, updateBooking } from './actions'

type Booking = {
    id: string
    title: string
    start_time: string
    end_time: string
    user_id: string
    rooms: {
        name: string
    }
}

export default function AdminBookingsList({ bookings }: { bookings: Booking[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({
        title: '',
        start_time: '',
        end_time: '',
    })
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleEdit = (booking: Booking) => {
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
            window.location.reload()
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
            window.location.reload()
        } catch (error) {
            alert('刪除預約失敗: ' + (error as Error).message)
        } finally {
            setIsDeleting(null)
        }
    }

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                找不到預約
            </div>
        )
    }

    return (
        <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
                <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        日期與時間
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        會議室
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        會議名稱
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        使用者 ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        操作
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
                {bookings.map((booking) => {
                    const isEditing = editingId === booking.id
                    const startTime = new Date(booking.start_time)
                    const endTime = new Date(booking.end_time)

                    return (
                        <tr key={booking.id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                {isEditing ? (
                                    <div className="space-y-2">
                                        <input
                                            type="datetime-local"
                                            value={editForm.start_time}
                                            onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                        />
                                        <input
                                            type="datetime-local"
                                            value={editForm.end_time}
                                            onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="font-medium text-gray-900">
                                            {startTime.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        </div>
                                        <div className="text-gray-500">
                                            {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })} - {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                        </div>
                                    </>
                                )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                {booking.rooms?.name || '未知'}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-900">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editForm.title}
                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-2 py-1 border"
                                    />
                                ) : (
                                    booking.title
                                )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 font-mono text-xs">
                                {booking.user_id.substring(0, 8)}...
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                {isEditing ? (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSave(booking.id)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            儲存
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-gray-600 hover:text-gray-900"
                                        >
                                            取消
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(booking)}
                                            className="text-indigo-600 hover:text-indigo-900"
                                        >
                                            編輯
                                        </button>
                                        <button
                                            onClick={() => handleDelete(booking.id)}
                                            disabled={isDeleting === booking.id}
                                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                        >
                                            {isDeleting === booking.id ? '刪除中...' : '刪除'}
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    )
                })}
            </tbody>
        </table>
    )
}
