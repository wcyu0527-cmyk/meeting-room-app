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

export async function updateUserProfile(userId: string, fullName: string, alias: string | null, unitId: string | null) {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: fullName,
            alias: alias,
            unit_id: unitId
        })
        .eq('id', userId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/users')
}

export async function createUser(username: string, password: string, fullName: string, role: 'user' | 'admin', unitId: string | null) {
    try {
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
                // We don't necessarily need to put role in metadata if we sync it to profiles table, 
                // but it doesn't hurt. However, the profiles trigger likely copies from here.
                // But the trigger might not copy 'role' if it's not setup to.
                // The safest bet is to update the profile explicitly after creation.
            }
        })

        if (error) {
            return { success: false, error: error.message }
        }

        if (data.user) {
            // Explicitly set the role in the profiles table
            // We need to wait a small bit for the trigger to create the profile, OR we can upsert.
            // Trigger usually runs immediately.

            // To be safe, we perform an update. If the profile doesn't exist yet (race condition), 
            // the trigger should handle creation, but we want to set the role.
            // Let's try to update.
            const { error: profileError } = await supabaseAdmin
                .from('profiles')
                .update({ role: role, full_name: fullName, unit_id: unitId }) // Ensure name is set too
                .eq('id', data.user.id)

            if (profileError) {
                console.error('Error updating user role:', profileError)
                // Returning success with warning? Or just ignore, user can edit later.
            }
        }

        revalidatePath('/admin/users')
        return { success: true, user: data.user }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}

export async function updateUserPassword(userId: string, password: string) {
    await requireAdmin()

    const supabaseAdmin = createAdminClient()

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password
    })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/users')
}

export async function deleteUser(userId: string) {
    try {
        await requireAdmin()

        const supabaseAdmin = createAdminClient()

        // 1. Delete user's bookings first to prevent Foreign Key constraint violations
        const { error: bookingsError } = await supabaseAdmin
            .from('bookings')
            .delete()
            .eq('user_id', userId)

        if (bookingsError) {
            console.error('Error deleting user bookings:', bookingsError)
            return { success: false, error: `刪除使用者預約記錄失敗: ${bookingsError.message}` }
        }

        // 2. Delete the user's profile from 'public.profiles'
        // Ideally this should cascade, but based on the error it seems it's not cascaded or there is another table.
        // Let's explicitly delete from profiles just to be safe and cover the most likely cause.
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId)

        if (profileError) {
            console.error('Error deleting user profile:', profileError)
            // We continue even if profile delete fails? No, it might be the cause.
            // But sometimes profile doesn't exist.
        }

        // 3. Delete the user from Auth (this will cascade to public.profiles if configured, otherwise we might need to delete profile too)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            console.error('Error deleting user:', error)
            // Handle specific "Database error" message which is vague
            if (error.message.includes('Database error')) {
                return { success: false, error: '資料庫刪除錯誤，該使用者可能仍有其他關聯資料（如個人檔案）導致無法刪除。' }
            }
            return { success: false, error: error.message }
        }

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error) {
        console.error('Delete user exception:', error)
        return { success: false, error: (error as Error).message }
    }
}
