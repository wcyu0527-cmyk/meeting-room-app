'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
            emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
        },
    })

    if (error) {
        redirect(`/signup?error=${encodeURIComponent(error.message)}`)
    }

    // Update profile with full name
    if (data.user) {
        await supabase
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', data.user.id)
    }

    // Check if email confirmation is required
    if (data?.user && !data.session) {
        redirect('/login?message=Please check your email to confirm your account')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
