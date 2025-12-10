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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bookings.map((booking) => {
                    const startTime = new Date(booking.start_time)
                    const endTime = new Date(booking.end_time)
                    const isExpired = isPast(booking)

                    return (
                        <div
                            key={booking.id}
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
                                    {isExpired && (
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                            已過期
                                        </span>
                                    )}
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
                                    onClick={() => setEditingBooking(booking)}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-8 px-3"
                                >
                                    編輯
                                </button>
                                <button
                                    onClick={() => handleDelete(booking.id)}
                                    disabled={isDeleting === booking.id}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-8 px-3"
                                >
                                    {isDeleting === booking.id ? '刪除中...' : '刪除'}
                                </button>
                            </div>
                        </div>
                    )
                })}
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
