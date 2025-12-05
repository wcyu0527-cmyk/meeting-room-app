'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/admin'

export async function updateRoom(
    roomId: string,
    name: string,
    capacity: number,
    equipment: string[]
) {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('rooms')
        .update({
            name,
            capacity,
            equipment,
        })
        .eq('id', roomId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/rooms')
    redirect('/admin/rooms')
}
