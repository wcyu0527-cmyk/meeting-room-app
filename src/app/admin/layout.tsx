import { isAdmin } from '@/utils/admin'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const admin = await isAdmin()

    if (!admin) {
        redirect('/?error=permission_denied')
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {children}
        </div>
    )
}
