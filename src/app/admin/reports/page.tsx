import Navbar from '@/components/Navbar'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
    const admin = await isAdmin()

    if (!admin) {
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            統計報表
                        </h1>
                    </div>
                    <div className="bg-white shadow rounded-lg p-6">
                        <ReportsClient />
                    </div>
                </div>
            </main>
        </div>
    )
}
