import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminRoomsList from './AdminRoomsList'

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
                            管理會議室
                        </h1>
                        <Link
                            href="/admin"
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← 返回管理後台
                        </Link>
                    </div>

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <AdminRoomsList rooms={rooms || []} />
                    </div>
                </div>
            </main>
        </div>
    )
}
