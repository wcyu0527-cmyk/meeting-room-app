import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminUsersList from './AdminUsersList'

export default async function AdminUsersPage() {
    const admin = await isAdmin()

    if (!admin) {
        redirect('/')
    }

    const supabase = await createClient()
    const supabaseAdmin = createAdminClient()

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, alias')
        .order('full_name', { ascending: true, nullsFirst: false })

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
    }

    // Fetch auth users to get emails
    const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
        perPage: 1000
    })

    if (usersError) {
        console.error('Error fetching users:', usersError)
    }

    // Merge profiles with user emails
    const profilesWithEmail = profiles?.map(profile => {
        const user = users?.find(u => u.id === profile.id)
        return {
            ...profile,
            email: user?.email || ''
        }
    }) || []

    return (
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">
                            管理使用者
                        </h1>
                        <Link
                            href="/admin"
                            className="text-sm text-gray-600 hover:text-gray-900"
                        >
                            ← 返回管理後台
                        </Link>
                    </div>

                    {(profilesError || usersError) && (
                        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                            錯誤: {profilesError?.message || usersError?.message}
                        </div>
                    )}

                    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                        <AdminUsersList profiles={profilesWithEmail} />
                    </div>
                </div>
            </main>
        </div>
    )
}
