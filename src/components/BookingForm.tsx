'use client'

import { useState, useEffect } from 'react'
import { Room, BookingWithRoom } from '@/types'

type Unit = {
    id: string
    name: string
    unit_members: { id: string, name: string }[]
}

type BookingFormProps = {
    isOpen: boolean
    onClose: () => void
    onSubmit: (formData: FormData) => Promise<void>
    onDelete?: () => Promise<void>
    initialData: BookingWithRoom | null
    rooms: Room[]
    units: Unit[]
    selectedDate: Date | null
    isReadOnly?: boolean
    isEcoOnlyEditable?: boolean
    title?: string
    userUnitId?: string
}

export default function BookingForm({
    isOpen,
    onClose,
    onSubmit,
    onDelete,
    initialData,
    rooms,
    units,
    selectedDate,
    isReadOnly = false,
    isEcoOnlyEditable = false,
    title,
    userUnitId
}: BookingFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedUnitId, setSelectedUnitId] = useState('')
    const [selectedMemberId, setSelectedMemberId] = useState('')
    const [cannotComplyReason, setCannotComplyReason] = useState('無提供便當')

    useEffect(() => {
        if (initialData) {
            setSelectedUnitId(initialData.unit_id || '')
            if (initialData.unit_member_id) {
                setSelectedMemberId(initialData.unit_member_id)
            } else if (initialData.custom_unit_member_name) {
                setSelectedMemberId('other')
            } else {
                setSelectedMemberId('')
            }
            setCannotComplyReason(initialData.cannot_comply_reason || '無提供便當')
        } else {
            setSelectedUnitId(userUnitId || '')
            setSelectedMemberId('')
            setCannotComplyReason('無提供便當')
        }
    }, [initialData, userUnitId])

    if (!isOpen) return null

    const selectedUnit = units.find(u => u.id === selectedUnitId)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)

        const formData = new FormData(e.currentTarget)
        const notes = formData.get('notes') as string
        const cannotComplyReasonValue = formData.get('cannot_comply_reason') as string

        // 驗證：如果選擇"因其他原因無法配合"，備註必填
        if (cannotComplyReasonValue === '因其他原因無法配合' && !notes.trim()) {
            alert('選擇「因其他原因無法配合」時，請在備註中說明原因')
            setIsSubmitting(false)
            return
        }

        try {
            await onSubmit(formData)
            onClose()
        } catch (error) {
            console.error(error)
            // Alert is handled by parent usually, but we can add one here if needed
            // But let's assume parent handles alerts or throws error which we catch here?
            // If parent throws, we catch it here.
            // But MonthCalendar handles alerts inside handleBookRoom.
            // Let's let parent handle success/failure alerts for flexibility.
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return
        if (!confirm('確定要刪除此預約嗎？')) return

        setIsSubmitting(true)
        try {
            await onDelete()
            onClose()
        } catch (error) {
            console.error(error)
            alert('刪除失敗')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-background rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                    {title || (initialData ? (
                        isReadOnly ? '預約詳情' :
                            isEcoOnlyEditable ? '編輯預約（僅限環保資訊）' :
                                '編輯預約'
                    ) : `預約會議 - ${selectedDate?.toLocaleDateString('zh-TW')}`)}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            會議室
                        </label>
                        <select
                            name="room_id"
                            required
                            disabled={isReadOnly || isEcoOnlyEditable}
                            defaultValue={initialData?.room_id}
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
                            會議名稱(必填)
                        </label>
                        <input
                            type="text"
                            name="title"
                            required
                            disabled={isReadOnly || isEcoOnlyEditable}
                            defaultValue={initialData?.title}
                            placeholder="例如：施工會議"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                登記單位(必填)
                            </label>
                            <select
                                name="unit_id"
                                value={selectedUnitId}
                                required
                                disabled={isReadOnly || isEcoOnlyEditable}
                                onChange={(e) => {
                                    setSelectedUnitId(e.target.value)
                                    setSelectedMemberId('')
                                }}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="">請選擇單位</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                聯絡人(必填)
                            </label>
                            <select
                                name="unit_member_id"
                                value={selectedMemberId}
                                required
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                disabled={!selectedUnitId || isReadOnly || isEcoOnlyEditable}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                            >
                                <option value="">{selectedUnitId ? '請選擇同仁' : '請先選擇單位'}</option>
                                {selectedUnit?.unit_members.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                                <option value="other">其他</option>
                            </select>
                            {selectedMemberId === 'other' && (
                                <input
                                    type="text"
                                    name="custom_unit_member_name"
                                    required
                                    defaultValue={initialData?.custom_unit_member_name || ''}
                                    placeholder="請輸入聯絡人姓名"
                                    disabled={isReadOnly || isEcoOnlyEditable}
                                    className="flex h-10 w-full mt-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                開始時間
                            </label>
                            <select
                                name="start_time"
                                required
                                disabled={isReadOnly || isEcoOnlyEditable}
                                defaultValue={initialData ? new Date(initialData.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "09:00"}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {Array.from({ length: 31 }).map((_, i) => {
                                    const totalMinutes = i * 30;
                                    const hour = 7 + Math.floor(totalMinutes / 60);
                                    const minute = totalMinutes % 60;
                                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                    return <option key={time} value={time}>{time}</option>
                                })}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1">
                                結束時間
                            </label>
                            <select
                                name="end_time"
                                required
                                disabled={isReadOnly || isEcoOnlyEditable}
                                defaultValue={initialData ? new Date(initialData.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : "10:00"}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {Array.from({ length: 31 }).map((_, i) => {
                                    const totalMinutes = i * 30;
                                    const hour = 7 + Math.floor(totalMinutes / 60);
                                    const minute = totalMinutes % 60;
                                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                                    return <option key={time} value={time}>{time}</option>
                                })}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">
                            備註 (選填)
                        </label>
                        <textarea
                            name="notes"
                            rows={3}
                            disabled={isReadOnly || isEcoOnlyEditable}
                            defaultValue={initialData?.notes || ''}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    disabled={isReadOnly}
                                    defaultValue={initialData?.category || '會議'}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    disabled={isReadOnly}
                                    defaultValue={initialData?.eco_box_count || 0}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    disabled={isReadOnly}
                                    defaultValue={initialData?.no_packaging_count || 0}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    disabled={isReadOnly}
                                    defaultValue={initialData?.takeout_count || 0}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    value={cannotComplyReason}
                                    onChange={(e) => setCannotComplyReason(e.target.value)}
                                    disabled={isReadOnly}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                                    disabled={isReadOnly}
                                    defaultValue={initialData?.approved_disposable_count || 0}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between space-x-2 pt-4">
                        {initialData && onDelete && !isReadOnly ? (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10 px-4 py-2"
                            >
                                刪除
                            </button>
                        ) : <div />}
                        <div className="flex space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                            >
                                {isReadOnly ? '關閉' : '取消'}
                            </button>
                            {!isReadOnly && (
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 disabled:opacity-50"
                                >
                                    {isSubmitting ? '儲存中...' : '儲存'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}
