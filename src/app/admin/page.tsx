import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminPage() {
    const admin = await isAdmin()

    if (!admin) {
        redirect('/')
    }

    const supabase = await createClient()

    // Get statistics
    const { count: totalRooms } = await supabase
        .from('rooms')
        .select('*', { count: 'exact', head: true })

    const { count: totalBookings } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })

    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h1 className="text-3xl font-bold text-foreground mb-6">
                        儀表板
                    </h1>

                    {/* Statistics */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                        <div className="bg-card text-card-foreground overflow-hidden shadow rounded-lg border border-border">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-muted-foreground truncate">
                                    會議室數量
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-foreground">
                                    {totalRooms || 0}
                                </dd>
                            </div>
                        </div>
                        <div className="bg-card text-card-foreground overflow-hidden shadow rounded-lg border border-border">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-muted-foreground truncate">
                                    預約數量
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-foreground">
                                    {totalBookings || 0}
                                </dd>
                            </div>
                        </div>
                        <div className="bg-card text-card-foreground overflow-hidden shadow rounded-lg border border-border">
                            <div className="px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-muted-foreground truncate">
                                    使用者數量
                                </dt>
                                <dd className="mt-1 text-3xl font-semibold text-foreground">
                                    {totalUsers || 0}
                                </dd>
                            </div>
                        </div>
                    </div>

                    {/* Management Links */}
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        <Link
                            href="/admin/rooms"
                            className="bg-card text-card-foreground overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border border-border"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    會議室管理
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    新增、編輯或刪除會議室
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/bookings"
                            className="bg-card text-card-foreground overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border border-border"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    預約管理
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    新增、編輯或刪除預約
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/users"
                            className="bg-card text-card-foreground overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border border-border"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    使用者管理
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    新增、編輯或刪除使用者帳號
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/units"
                            className="bg-card text-card-foreground overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border border-border"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    管理單位群組與人員
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    新增、編輯或刪除單位群組與人員名單
                                </p>
                            </div>
                        </Link>

                        <Link
                            href="/admin/reports"
                            className="bg-card text-card-foreground overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow border border-border"
                        >
                            <div className="px-4 py-5 sm:p-6">
                                <h3 className="text-lg font-medium text-foreground mb-2">
                                    統計報表
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    查詢免洗餐具及包裝飲用水減量填報
                                </p>
                            </div>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
