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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-foreground">
                            統計報表
                        </h1>
                    </div>
                    <div className="bg-card shadow rounded-lg p-6 border border-border">
                        <ReportsClient />
                    </div>
                </div>
            </main>
        </div>
    )
}
