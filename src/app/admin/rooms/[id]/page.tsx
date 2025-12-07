import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import EditRoomForm from './EditRoomForm'

export default async function EditRoomPage({
    params
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const admin = await isAdmin()

    if (!admin) {
        redirect('/')
    }

    const supabase = await createClient()
    const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !room) {
        console.error('Error fetching room:', error)
        redirect('/admin/rooms')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-3xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-gray-900 mb-6">
                        編輯會議室: {room.name}
                    </h1>

                    <div className="bg-white shadow sm:rounded-lg p-6">
                        <EditRoomForm room={room} />
                    </div>
                </div>
            </main>
        </div>
    )
}
