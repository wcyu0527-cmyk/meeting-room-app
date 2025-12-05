'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const usernameOrEmail = formData.get('username') as string
    const password = formData.get('password') as string

    let email = usernameOrEmail

    // Check if input is a username (not an email)
    if (!usernameOrEmail.includes('@')) {
        // Look up email by username from profiles table
        const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', usernameOrEmail.toLowerCase())
            .single()

        if (profile && profile.email) {
            email = profile.email
        } else {
            redirect(`/login?error=${encodeURIComponent('Invalid username or password')}`)
        }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect(`/login?error=${encodeURIComponent('Invalid username or password')}`)
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
