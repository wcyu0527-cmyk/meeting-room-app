import { Room } from '@/types'
import Link from 'next/link'

export default function RoomCard({ room }: { room: Room }) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg">
            {room.image_url && (
                <div className="h-48 w-full relative">
                    <img
                        src={room.image_url}
                        alt={room.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {room.name}
                </h3>
                <div className="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Capacity: {room.capacity} people</p>
                    <p>Equipment: {room.equipment?.join(', ')}</p>
                </div>
                <div className="mt-5">
                    <Link
                        href={`/rooms/${room.id}`}
                        className="inline-flex items-center justify-center px-4 py-2 border border-transparent font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
                    >
                        View Schedule & Book
                    </Link>
                </div>
            </div>
        </div>
    )
}
