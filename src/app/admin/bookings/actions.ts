'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { requireAdmin } from '@/utils/admin'

export async function deleteBooking(bookingId: string) {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/bookings')
}

export async function updateBooking(
    bookingId: string,
    title: string,
    startTime: string,
    endTime: string
) {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
        .from('bookings')
        .update({
            title,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
        })
        .eq('id', bookingId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/admin/bookings')
}
