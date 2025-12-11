'use client'

import { useState } from 'react'
import Link from 'next/link'
import { deleteRoom } from './actions'

type Room = {
    id: string
    name: string
    capacity: number
    equipment: string[] | null
}

export default function AdminRoomsList({ rooms }: { rooms: Room[] }) {
    const [isDeleting, setIsDeleting] = useState<string | null>(null)

    const handleDelete = async (roomId: string) => {
        if (!confirm('確定要刪除此會議室嗎？相關的預約也會被刪除。')) {
            return
        }

        setIsDeleting(roomId)
        try {
            await deleteRoom(roomId)
        } catch (error) {
            alert('刪除會議室失敗: ' + (error as Error).message)
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
                <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-foreground sm:pl-6">
                        會議室名稱
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        容納人數
                    </th>
                    <th scope="col" className="hidden px-3 py-3.5 text-left text-sm font-semibold text-foreground sm:table-cell">
                        設備
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">
                        動作
                    </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
                {rooms?.map((room) => (
                    <tr key={room.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                            {room.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-muted-foreground">
                            {room.capacity} 人
                        </td>
                        <td className="hidden px-3 py-4 text-sm text-muted-foreground sm:table-cell">
                            {room.equipment?.join(', ')}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <div className="flex gap-3">
                                <Link
                                    href={`/admin/rooms/${room.id}`}
                                    className="text-primary hover:text-primary/80"
                                >
                                    編輯
                                </Link>
                                <button
                                    onClick={() => handleDelete(room.id)}
                                    disabled={isDeleting === room.id}
                                    className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                                >
                                    {isDeleting === room.id ? '刪除中...' : '刪除'}
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
