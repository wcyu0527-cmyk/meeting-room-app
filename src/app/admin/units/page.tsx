import Navbar from '@/components/Navbar'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import UnitList from './UnitList'

export default async function AdminUnitsPage() {
    const supabase = await createClient()

    const { data: units, error } = await supabase
        .from('units')
        .select(`
            id, 
            name, 
            unit_members (
                id, 
                name
            )
        `)
        .order('name')

    if (error) {
        console.error('Error fetching units:', error)
    }

    // Sort members by name for each unit
    const sortedUnits = units?.map(unit => ({
        ...unit,
        unit_members: unit.unit_members.sort((a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name))
    })) || []

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 dark:from-blue-950 dark:via-blue-900 dark:to-cyan-950">
            <Navbar />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-3xl font-bold text-foreground">
                            管理單位群組與人員
                        </h1>
                        <Link
                            href="/admin"
                            className="text-sm text-muted-foreground hover:text-foreground"
                        >
                            ← 返回儀表板
                        </Link>
                    </div>

                    <UnitList units={sortedUnits} />
                </div>
            </main>
        </div>
    )
}
