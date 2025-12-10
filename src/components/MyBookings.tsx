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
    const [editingBooking, setEditingBooking] = useState<BookingWithRoom | null>(null)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    if (!bookings || bookings.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                您目前沒有預約
            </div>
        )
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

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingBooking) return

        setIsSubmitting(true)
        const formData = new FormData(e.currentTarget)

        const startTime = new Date(formData.get('start_time') as string)
        const endTime = new Date(formData.get('end_time') as string)

        if (endTime <= startTime) {
            alert('結束時間必須晚於開始時間')
            setIsSubmitting(false)
            return
        }

        try {
            const updateData = {
                title: formData.get('title') as string,
                start_time: formData.get('start_time') as string,
                end_time: formData.get('end_time') as string,
                notes: formData.get('notes') as string || null,
                category: formData.get('category') as string || '會議',
                eco_box_count: parseInt(formData.get('eco_box_count') as string) || 0,
                no_packaging_count: parseInt(formData.get('no_packaging_count') as string) || 0,
                takeout_count: parseInt(formData.get('takeout_count') as string) || 0,
                cannot_comply_reason: formData.get('cannot_comply_reason') as string || '無提供便當',
                approved_disposable_count: parseInt(formData.get('approved_disposable_count') as string) || 0,
            }

            await updateBooking(editingBooking.id, updateData)
            setEditingBooking(null)
            alert('更新成功！')
        } catch (error) {
            alert('更新預約失敗: ' + (error as Error).message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const isPast = (booking: BookingWithRoom) => {
        return new Date(booking.end_time) < new Date()
    }

    return (
        <>
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
                                會議名稱
                            </th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                                選項
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                        {bookings.map((booking) => {
                            const startTime = new Date(booking.start_time)
                            const endTime = new Date(booking.end_time)
                            const isExpired = isPast(booking)

                            return (
                                <tr key={booking.id} className={isExpired ? 'bg-muted/50 opacity-75' : ''}>
                                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                        <div className="font-medium text-foreground">
                                            {startTime.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', year: 'numeric' })}
                                            {isExpired && <span className="ml-2 text-xs text-muted-foreground">(已過期)</span>}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {startTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })} - {endTime.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-foreground">
                                        {booking.rooms.name}
                                    </td>
                                    <td className="px-3 py-4 text-sm text-foreground">
                                        {booking.title}
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <div className="flex gap-2">
                                            <>
                                                <button
                                                    onClick={() => setEditingBooking(booking)}
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
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-border">
                        <h3 className="text-lg font-semibold text-foreground mb-4">
                            編輯預約
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    會議室
                                </label>
                                <input
                                    type="text"
                                    value={editingBooking.rooms.name}
                                    disabled
                                    className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    會議主題
                                </label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    defaultValue={editingBooking.title}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        開始時間
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="start_time"
                                        required
                                        defaultValue={new Date(editingBooking.start_time).toISOString().slice(0, 16)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        結束時間
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="end_time"
                                        required
                                        defaultValue={new Date(editingBooking.end_time).toISOString().slice(0, 16)}
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                                    defaultValue={(editingBooking as any).notes || ''}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                            </div>

                            {/* 免洗餐具及包裝飲用水減量填報 */}
                            <div className="border-t border-border pt-4 mt-4">
                                <h4 className="text-sm font-semibold text-foreground mb-3">免洗餐具及包裝飲用水減量填報</h4>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* 類別 */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            類別
                                        </label>
                                        <select
                                            name="category"
                                            defaultValue={(editingBooking as any).category || '會議'}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="會議">會議</option>
                                            <option value="訓練">訓練</option>
                                            <option value="活動">活動</option>
                                        </select>
                                    </div>

                                    {/* 訂購環保餐盒數量 */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            訂購環保餐盒數量
                                        </label>
                                        <input
                                            type="number"
                                            name="eco_box_count"
                                            min="0"
                                            defaultValue={(editingBooking as any).eco_box_count || 0}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>

                                    {/* 未使用包裝水、紙杯人數 */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            未使用包裝水、紙杯人數
                                        </label>
                                        <input
                                            type="number"
                                            name="no_packaging_count"
                                            min="0"
                                            defaultValue={(editingBooking as any).no_packaging_count || 0}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>

                                    {/* 提供外帶餐盒數量 */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            提供外帶餐盒數量
                                            <span className="text-xs text-muted-foreground ml-1">(提供非塑膠包裝之餐點數量，不含便當)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="takeout_count"
                                            min="0"
                                            defaultValue={(editingBooking as any).takeout_count || 0}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    {/* 無法配合減少使用免洗餐具及包裝飲用水的原因 */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            無法配合減少使用免洗餐具及包裝飲用水的原因
                                        </label>
                                        <select
                                            name="cannot_comply_reason"
                                            defaultValue={(editingBooking as any).cannot_comply_reason || '無提供便當'}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        >
                                            <option value="無提供便當">無提供便當</option>
                                            <option value="因訂購數量無法配合">因訂購數量無法配合</option>
                                            <option value="因收送時間無法配合">因收送時間無法配合</option>
                                            <option value="因辦理地點無法配合">因辦理地點無法配合</option>
                                            <option value="因其他原因無法配合">因其他原因無法配合</option>
                                        </select>
                                    </div>

                                    {/* 本次經簽准使用免洗餐盒數量 */}
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            本次經簽准使用免洗餐盒數量
                                        </label>
                                        <input
                                            type="number"
                                            name="approved_disposable_count"
                                            min="0"
                                            defaultValue={(editingBooking as any).approved_disposable_count || 0}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingBooking(null)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? '更新中...' : '更新預約'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
