'use client'

import { useState } from 'react'
import { updateRoom } from '../actions'

type Room = {
    id: string
    name: string
    capacity: number
    equipment: string[]
}

export default function EditRoomForm({ room }: { room: Room }) {
    const [name, setName] = useState(room.name)
    const [capacity, setCapacity] = useState(room.capacity.toString())
    const [equipment, setEquipment] = useState(room.equipment.join(', '))
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError('')

        try {
            const equipmentArray = equipment
                .split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0)

            await updateRoom(
                room.id,
                name,
                parseInt(capacity),
                equipmentArray
            )
        } catch (err) {
            setError((err as Error).message)
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground">
                    會議室名稱
                </label>
                <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-3 py-2 border bg-background text-foreground"
                />
            </div>

            <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    容納人數
                </label>
                <input
                    type="number"
                    id="capacity"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    required
                    min="1"
                    className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-3 py-2 border bg-background text-foreground"
                />
            </div>

            <div>
                <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
                    設備 (請用逗號分隔)
                </label>
                <input
                    type="text"
                    id="equipment"
                    value={equipment}
                    onChange={(e) => setEquipment(e.target.value)}
                    placeholder="投影機, 白板, 電視"
                    className="mt-1 block w-full rounded-md border-input shadow-sm focus:border-ring focus:ring-ring sm:text-sm px-3 py-2 border bg-background text-foreground"
                />
                <p className="mt-1 text-sm text-muted-foreground">
                    請使用逗號分隔項目
                </p>
            </div>

            <div className="flex gap-4">
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
                >
                    {isSubmitting ? '儲存中...' : '儲存變更'}
                </button>
                <a
                    href="/admin/rooms"
                    className="flex-1 bg-muted text-foreground px-4 py-2 rounded-md hover:bg-muted/80 text-center"
                >
                    取消
                </a>
            </div>
        </form>
    )
}
