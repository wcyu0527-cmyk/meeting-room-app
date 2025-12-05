import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminRoomsPage() {
    const admin = await isAdmin()

    if (!admin) {
        redirect('/')
    }

    const supabase = await createClient()
    const { data: rooms } = await supabase
        .from('rooms')
        .select('*')
        .order('name')

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Manage Rooms
                        </h1>
                        <Link
                            href="/admin"
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← Back to Admin
                        </Link>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                        Name
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Capacity
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Equipment
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {rooms?.map((room) => (
                                    <tr key={room.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                            {room.name}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {room.capacity} people
                                        </td>
                                        <td className="px-3 py-4 text-sm text-gray-500">
                                            {room.equipment?.join(', ')}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <Link
                                                href={`/admin/rooms/${room.id}`}
                                                className="text-indigo-600 hover:text-indigo-900"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    )
}
