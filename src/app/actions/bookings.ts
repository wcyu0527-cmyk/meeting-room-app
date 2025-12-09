'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function deleteBooking(bookingId: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if the booking belongs to the user
    const { data: booking } = await supabase
        .from('bookings')
        .select('user_id, end_time')
        .eq('id', bookingId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    if (!booking) {
        throw new Error('Booking not found')
    }

    if (booking.user_id !== user.id && !isAdmin) {
        throw new Error('Unauthorized')
    }

    const isExpired = new Date(booking.end_time) < new Date()
    if (isExpired && !isAdmin) {
        throw new Error('無法刪除已過期的預約')
    }

    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/')
}

export async function updateBooking(
    bookingId: string,
    title: string,
    startTime: string,
    endTime: string
) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check if the booking belongs to the user
    const { data: booking } = await supabase
        .from('bookings')
        .select('user_id, end_time')
        .eq('id', bookingId)
        .single()

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    const isAdmin = profile?.role === 'admin'

    if (!booking) {
        throw new Error('Booking not found')
    }

    if (booking.user_id !== user.id && !isAdmin) {
        throw new Error('Unauthorized')
    }

    const isExpired = new Date(booking.end_time) < new Date()
    if (isExpired && !isAdmin) {
        throw new Error('無法修改已過期的預約')
    }

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

    revalidatePath('/')
}
