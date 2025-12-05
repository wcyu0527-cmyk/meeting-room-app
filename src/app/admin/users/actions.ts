'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/admin'

export async function updateUserRole(userId: string, role: 'user' | 'admin') {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/users')
}

export async function updateUserName(userId: string, fullName: string) {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/users')
}
