'use client'

import { useState } from 'react'
import { deleteBooking, updateBooking, bulkDeleteBookings } from './actions'

type Booking = {
    id: string
    title: string
    start_time: string
    end_time: string
    user_id: string
    created_at: string
    rooms: {
        name: string
    }
    units: {
        name: string
    } | null
    unit_members: {
        name: string
    } | null
}

export default function AdminBookingsList({ bookings }: { bookings: Booking[] }) {
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState({
        title: '',
        start_time: '',
        end_time: '',
    })
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [isBulkDeleting, setIsBulkDeleting] = useState(false)

    // Check handling
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(bookings.map(b => b.id)))
        } else {
            setSelectedIds(new Set())
        }
    }

    const handleSelectOne = (id: string, checked: boolean) => {
        const newSelected = new Set(selectedIds)
        if (checked) {
            newSelected.add(id)
        } else {
            newSelected.delete(id)
        }
        setSelectedIds(newSelected)
    }

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return
        if (!confirm(`確定要刪除選中的 ${selectedIds.size} 筆預約嗎？`)) return

        setIsBulkDeleting(true)
        try {
            await bulkDeleteBookings(Array.from(selectedIds))
            setSelectedIds(new Set())
            window.location.reload()
        } catch (error) {
            alert('批次刪除失敗: ' + (error as Error).message)
        } finally {
            setIsBulkDeleting(false)
        }
    }

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
            const errorMessage = (error as Error).message
            if (errorMessage.includes('conflicting key value violates exclusion constraint "no_overlap"')) {
                alert('更新預約失敗:同時段已有登記')
            } else if (errorMessage.includes('bookings_time_check')) {
                alert('更新預約失敗: 結束時間必須晚於開始時間')
            } else {
                alert('更新預約失敗: ' + errorMessage)
            }
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

    const isAllSelected = bookings.length > 0 && selectedIds.size === bookings.length

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                找不到預約
            </div>
        )
    }

    return (
        <div>
            {selectedIds.size > 0 && (
                <div className="bg-muted p-4 mb-4 rounded-lg flex items-center justify-between">
                    <span className="text-sm font-medium">已選擇 {selectedIds.size} 筆預約</span>
                    <button
                        onClick={handleBulkDelete}
                        disabled={isBulkDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                    >
                        {isBulkDeleting ? '刪除中...' : '批次刪除'}
                    </button>
                </div>
            )}
            <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left sm:pl-6 w-10">
                            <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={handleSelectAll}
                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                            />
                        </th>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6 w-32">
                            時間
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            會議室
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            會議名稱
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            登記單位
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            聯絡人
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            登記時間
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                            動作
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {bookings.map((booking) => {
                        const isEditing = editingId === booking.id
                        const startTime = new Date(booking.start_time)
                        const endTime = new Date(booking.end_time)
                        const createdAt = new Date(booking.created_at)
                        const isSelected = selectedIds.has(booking.id)

                        return (
                            <tr key={booking.id} className={isSelected ? 'bg-muted/30' : ''}>
                                <td className="py-4 pl-4 pr-3 sm:pl-6">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={(e) => handleSelectOne(booking.id, e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                </td>
                                <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 w-32">
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <input
                                                type="datetime-local"
                                                value={editForm.start_time}
                                                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
                                                className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-2 py-1 border bg-background text-foreground"
                                            />
                                            <input
                                                type="datetime-local"
                                                value={editForm.end_time}
                                                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                                className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-2 py-1 border bg-background text-foreground"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-medium text-foreground">
                                                {startTime.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric' })}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })} - {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                            </div>
                                        </>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                    {booking.rooms?.name || '未知'}
                                </td>
                                <td className="px-3 py-4 text-sm text-foreground">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-2 py-1 border bg-background text-foreground"
                                        />
                                    ) : (
                                        booking.title
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                    {booking.units?.name || '-'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                    {booking.unit_members?.name || '-'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                                    {createdAt.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })} {createdAt.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
