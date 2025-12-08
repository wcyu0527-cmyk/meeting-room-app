'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { headers } from 'next/headers'
import { checkRateLimit, recordFailedAttempt, clearRateLimit } from '@/utils/rate-limit'

export async function login(formData: FormData) {
    const headersList = await headers()
    // Get IP address, handling potential multiple IPs in x-forwarded-for
    const forwardedFor = headersList.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1'

    // 1. Check Rate Limit
    const { allowed, retryAfter } = await checkRateLimit(ip)
    if (!allowed) {
        redirect(`/login?error=${encodeURIComponent(`登入失敗次數過多，請於 ${retryAfter} 分鐘後再試。`)}`)
    }

    const supabase = await createClient()

    const username = formData.get('username') as string
    const password = formData.get('password') as string

    // If username is not an email, append a default domain
    const email = username.includes('@') ? username : `${username}@meeting.local`

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        // 2. Record Failed Attempt
        await recordFailedAttempt(ip)
        redirect(`/login?error=${encodeURIComponent('帳號或密碼錯誤')}`)
    }

    // 3. Clear Rate Limit on Success
    await clearRateLimit(ip)

    revalidatePath('/', 'layout')
    redirect('/')
}
