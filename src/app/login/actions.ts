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
        // Look up email by username
        const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', usernameOrEmail.toLowerCase())
            .single()

        if (profile) {
            // Get email from auth.users
            const { data: { users } } = await supabase.auth.admin.listUsers()
            const user = users?.find(u => u.id === profile.id)
            if (user) {
                email = user.email || usernameOrEmail
            }
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
