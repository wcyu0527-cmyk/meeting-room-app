'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const username = formData.get('username') as string

    // Validate username format
    if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        redirect(`/signup?error=${encodeURIComponent('Username must be 3-20 characters, lowercase letters, numbers, and underscores only')}`)
    }

    // Check if username already exists
    const { data: existingUser } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username.toLowerCase())
        .single()

    if (existingUser) {
        redirect(`/signup?error=${encodeURIComponent('Username already taken')}`)
    }

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username.toLowerCase(),
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (error) {
        redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    // Update profile with username and email
    if (data.user) {
        await supabase
            .from('profiles')
            .update({
                username: username.toLowerCase(),
                email: email
            })
            .eq('id', data.user.id)
    }

    // Check if email confirmation is required
    if (data?.user && !data.session) {
        redirect('/login?message=Please check your email to confirm your account')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
