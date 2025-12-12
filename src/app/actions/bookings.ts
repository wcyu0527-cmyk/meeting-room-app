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



    const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/')
    revalidatePath('/my-bookings')
}

export async function updateBooking(
    bookingId: string,
    updateData: {
        room_id?: string
        title: string
        start_time: string
        end_time: string
        notes?: string | null
        category?: string
        eco_box_count?: number
        no_packaging_count?: number
        takeout_count?: number
        cannot_comply_reason?: string
        approved_disposable_count?: number
        unit_id?: string
        unit_member_id?: string
    }
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



    const { error } = await supabase
        .from('bookings')
        .update({
            room_id: updateData.room_id,
            title: updateData.title,
            start_time: new Date(updateData.start_time).toISOString(),
            end_time: new Date(updateData.end_time).toISOString(),
            notes: updateData.notes,
            category: updateData.category || '會議',
            eco_box_count: updateData.eco_box_count || 0,
            no_packaging_count: updateData.no_packaging_count || 0,
            takeout_count: updateData.takeout_count || 0,
            cannot_comply_reason: updateData.cannot_comply_reason || '無提供便當',
            approved_disposable_count: updateData.approved_disposable_count || 0,
            unit_id: updateData.unit_id || null,
            unit_member_id: updateData.unit_member_id || null,
        })
        .eq('id', bookingId)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/')
    revalidatePath('/my-bookings')
}
