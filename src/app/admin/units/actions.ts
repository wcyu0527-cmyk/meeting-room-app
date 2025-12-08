'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { requireAdmin } from '@/utils/admin'
import { revalidatePath } from 'next/cache'

export async function createUnit(name: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('units')
            .insert({ name })

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/units')
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}

export async function updateUnit(id: string, name: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('units')
            .update({ name })
            .eq('id', id)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/units')
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}

export async function deleteUnit(id: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('units')
            .delete()
            .eq('id', id)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/units')
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}

export async function createUnitMember(unitId: string, name: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('unit_members')
            .insert({ unit_id: unitId, name })

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/units')
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}

export async function deleteUnitMember(id: string) {
    try {
        await requireAdmin()
        const supabase = await createClient()

        const { error } = await supabase
            .from('unit_members')
            .delete()
            .eq('id', id)

        if (error) return { success: false, error: error.message }

        revalidatePath('/admin/units')
        return { success: true }
    } catch (error) {
        return { success: false, error: (error as Error).message }
    }
}
