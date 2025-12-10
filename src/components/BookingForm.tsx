'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

type Unit = {
    id: string
    name: string
    unit_members: { id: string; name: string }[]
}

export default function BookingForm({ roomId }: { roomId: string }) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [units, setUnits] = useState<Unit[]>([])

    // Form state
    const [selectedUnitId, setSelectedUnitId] = useState('')
    const [selectedMemberId, setSelectedMemberId] = useState('')

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
                // Sort members by name
                const sortedUnits = data.map((unit: unknown) => ({
                    ...(unit as Unit),
                    unit_members: (unit as Unit).unit_members.sort((a, b) => a.name.localeCompare(b.name))
                }))
                setUnits(sortedUnits)
            }
        }

        fetchUnits()
    }, [])

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const startTime = formData.get('start_time') as string
        const endTime = formData.get('end_time') as string
        const notes = formData.get('notes') as string

        const supabase = createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            router.push('/login')
            return
        }

        const { error } = await supabase.from('bookings').insert({
            room_id: roomId,
            user_id: user.id,
            title,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            notes: notes || null,
            unit_id: selectedUnitId || null,
            unit_member_id: selectedMemberId || null
        })

        if (error) {
            setError(error.message)
        } else {
            // Reset form
            (e.target as HTMLFormElement).reset()
            setSelectedUnitId('')
            setSelectedMemberId('')
            router.refresh()
            router.push('/my-bookings')
        }

        setIsSubmitting(false)
    }

    const selectedUnit = units.find(u => u.id === selectedUnitId)

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-bold text-gray-900 mb-1">
                    Book this room
                </h3>
                <p className="text-sm text-gray-600 mb-5">
                    Fill in the details to reserve this meeting room
                </p>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-900 mb-1"
                        >
                            Meeting Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            id="title"
                            required
                            placeholder="e.g., Team Standup Meeting"
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-900"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="unit"
                                className="block text-sm font-medium text-gray-900 mb-1"
                            >
                                單位 (Unit)
                            </label>
                            <select
                                id="unit"
                                value={selectedUnitId}
                                onChange={(e) => {
                                    setSelectedUnitId(e.target.value)
                                    setSelectedMemberId('')
                                }}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-900 bg-white"
                            >
                                <option value="">請選擇單位</option>
                                {units.map(unit => (
                                    <option key={unit.id} value={unit.id}>{unit.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label
                                htmlFor="member"
                                className="block text-sm font-medium text-gray-900 mb-1"
                            >
                                同仁 (Colleague)
                            </label>
                            <select
                                id="member"
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                disabled={!selectedUnitId}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-900 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                            >
                                <option value="">{selectedUnitId ? '請選擇同仁' : '請先選擇單位'}</option>
                                {selectedUnit?.unit_members.map(member => (
                                    <option key={member.id} value={member.id}>{member.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="start_time"
                                className="block text-sm font-medium text-gray-900 mb-1"
                            >
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="start_time"
                                id="start_time"
                                required
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-900"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="end_time"
                                className="block text-sm font-medium text-gray-900 mb-1"
                            >
                                End Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="datetime-local"
                                name="end_time"
                                id="end_time"
                                required
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-900"
                            />
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="notes"
                            className="block text-sm font-medium text-gray-900 mb-1"
                        >
                            Notes (Optional)
                        </label>
                        <textarea
                            name="notes"
                            id="notes"
                            rows={3}
                            placeholder="Add any additional information or special requirements..."
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2.5 border text-gray-900"
                        />
                    </div>

                    {error && (
                        <div className="rounded-md bg-red-50 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-red-800">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Booking...
                                </>
                            ) : (
                                'Book Room'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
