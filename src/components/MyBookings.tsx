'use client'

import { useState } from 'react'
import { deleteBooking, updateBooking } from '@/app/actions/bookings'
import { Booking, Room } from '@/types'

type BookingWithRoom = Booking & {
    rooms: Room
}

export default function MyBookings({
    bookings,
    userId
}: {
    bookings: BookingWithRoom[]
    userId: string
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
            <div className="text-center py-8 text-gray-500">
                You have no bookings
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
            alert('Failed to update booking: ' + (error as Error).message)
        }
    }

    const handleDelete = async (bookingId: string) => {
        if (!confirm('Are you sure you want to delete this booking?')) {
            return
        }

        setIsDeleting(bookingId)
        try {
            await deleteBooking(bookingId)
        } catch (error) {
            alert('Failed to delete booking: ' + (error as Error).message)
        } finally {
            setIsDeleting(null)
        }
    }

    return (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                    <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                            Date & Time
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Room
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Title
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                            Actions
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
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                            <input
                                                type="datetime-local"
                                                value={editForm.end_time}
                                                onChange={(e) => setEditForm({ ...editForm, end_time: e.target.value })}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="font-medium text-gray-900">
                                                {startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="text-gray-500">
                                                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </>
                                    )}
                                </td>
                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                    {booking.rooms.name}
                                </td>
                                <td className="px-3 py-4 text-sm text-gray-900">
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
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
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEdit(booking)}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(booking.id)}
                                                disabled={isDeleting === booking.id}
                                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                            >
                                                {isDeleting === booking.id ? 'Deleting...' : 'Delete'}
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
