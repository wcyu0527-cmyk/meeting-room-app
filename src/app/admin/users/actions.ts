'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
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

export async function updateUserProfile(userId: string, fullName: string, alias: string | null) {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            alias: alias
        })
        .eq('id', userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/users')
}

export async function createUser(username: string, password: string, fullName: string, alias: string) {
    await requireAdmin()

    const supabaseAdmin = createAdminClient()

    // If username is not an email, append a default domain
    const email = username.includes('@') ? username : `${username}@meeting.local`

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName,
            alias: alias
        }
    })

    if (error) {
        throw new Error(error.message)
    }

    // Ensure profile is updated (trigger might handle it, but we want to be sure about the alias if trigger doesn't pick it up correctly or if we want to be safe)
    // The trigger I wrote uses raw_user_meta_data, so it should work. 
    // But let's double check if we need to manually update just in case.
    // Actually, let's trust the trigger for now, but if it fails we might need to upsert.

    revalidatePath('/admin/users')
    return data.user
}

export async function deleteUser(userId: string) {
    await requireAdmin()

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/users')
}
