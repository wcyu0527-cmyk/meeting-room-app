import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import Link from 'next/link'
import AdminUsersList from './AdminUsersList'

export default async function AdminUsersPage() {
    const supabase = await createClient()

    let profiles: { id: string, full_name: string | null, role: string, alias: string | null, unit_id: string | null, units: { name: string } | null }[] = []
    let units: { id: string, name: string }[] = []
    let users: { id: string, email?: string }[] = []
    let fetchError: string | null = null

    try {
        // Fetch units
        const { data: unitsData, error: unitsError } = await supabase
            .from('units')
            .select('id, name')
            .order('name')

        if (unitsError) throw unitsError
        if (unitsData) units = unitsData

        // Fetch profiles with units
        const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, role, alias, unit_id, units(name)')
            .order('full_name', { ascending: true, nullsFirst: false })

        if (profilesError) throw profilesError
        if (profilesData) profiles = profilesData as any

        // Try to fetch auth users
        try {
            const supabaseAdmin = createAdminClient()
            const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
                perPage: 1000
            })
            if (usersError) {
                console.error('Error fetching users:', usersError)
            } else {
                users = usersData.users
            }
        } catch (adminError) {
            console.error('Error creating admin client or fetching users:', adminError)
        }

    } catch (error) {
        console.error('Error loading admin users page:', error)
        fetchError = (error as Error).message
    }

    // Merge profiles with user emails
    const profilesWithEmail = profiles.map(profile => {
        const user = users.find(u => u.id === profile.id)
        return {
            ...profile,
            email: user?.email || ''
        }
    })

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-foreground">
                            使用者管理
                        </h1>
                        <Link
                            href="/admin"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            ← 返回儀表板
                        </Link>
                    </div>

                    {fetchError && (
                        <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded">
                            錯誤: {fetchError}
                        </div>
                    )}

                    <div className="bg-card shadow overflow-hidden sm:rounded-lg border border-border">
                        <AdminUsersList profiles={profilesWithEmail} units={units} />
                    </div>
                </div>
            </main>
        </div>
    )
}
