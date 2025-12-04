'use client'

import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function BookingForm({ roomId }: { roomId: string }) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setIsSubmitting(true)
        setError(null)

        const formData = new FormData(e.currentTarget)
        const title = formData.get('title') as string
        const startTime = formData.get('start_time') as string
        const endTime = formData.get('end_time') as string

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
        })

        if (error) {
            setError(error.message)
        } else {
            // Reset form
            (e.target as HTMLFormElement).reset()
        }

        setIsSubmitting(false)
    }

    return (
        <div className="bg-white shadow sm:rounded-lg mt-6">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Book this room
                </h3>
                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                    <div>
                        <label
                            htmlFor="title"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Meeting Title
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="start_time"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Start Time
                            </label>
                            <div className="mt-1">
                                <input
                                    type="datetime-local"
                                    name="start_time"
                                    id="start_time"
                                    required
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                />
                            </div>
                        </div>

                        <div>
                            <label
                                htmlFor="end_time"
                                className="block text-sm font-medium text-gray-700"
                            >
                                End Time
                            </label>
                            <div className="mt-1">
                                <input
                                    type="datetime-local"
                                    name="end_time"
                                    id="end_time"
                                    required
                                    className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                />
                            </div>
                        </div>
                    </div>

                    {error && <div className="text-red-500 text-sm">{error}</div>}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Booking...' : 'Book Room'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
