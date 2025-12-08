import { createAdminClient } from './supabase/admin'

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MINUTES = 5

export async function checkRateLimit(ip: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('ip_address', ip)
        .single()

    if (error && error.code !== 'PGRST116') {
        // PGRST116 is "The result contains 0 rows"
        console.error('Rate limit check error:', error)
        // Fail open if DB error, or fail closed? Fail open for now to avoid locking everyone out if table missing
        return { allowed: true }
    }

    if (!data) return { allowed: true }

    const lastAttempt = new Date(data.last_attempt)
    const now = new Date()
    const timeDiff = (now.getTime() - lastAttempt.getTime()) / 1000 / 60 // minutes

    // If the block has expired
    if (timeDiff > BLOCK_DURATION_MINUTES) {
        return { allowed: true }
    }

    // If attempts exceed limit and still within block duration
    if (data.attempts >= MAX_ATTEMPTS) {
        return {
            allowed: false,
            retryAfter: Math.ceil(BLOCK_DURATION_MINUTES - timeDiff)
        }
    }

    return { allowed: true }
}

export async function recordFailedAttempt(ip: string) {
    const supabase = createAdminClient()

    const { data } = await supabase
        .from('login_attempts')
        .select('*')
        .eq('ip_address', ip)
        .single()

    const now = new Date().toISOString()

    if (!data) {
        await supabase.from('login_attempts').insert({
            ip_address: ip,
            attempts: 1,
            last_attempt: now
        })
    } else {
        const lastAttempt = new Date(data.last_attempt)
        const timeDiff = (new Date().getTime() - lastAttempt.getTime()) / 1000 / 60

        let newAttempts = data.attempts + 1

        // If previous attempts were from a long time ago, reset count
        if (timeDiff > BLOCK_DURATION_MINUTES) {
            newAttempts = 1
        }

        await supabase.from('login_attempts').update({
            attempts: newAttempts,
            last_attempt: now
        }).eq('ip_address', ip)
    }
}

export async function clearRateLimit(ip: string) {
    const supabase = createAdminClient()
    await supabase.from('login_attempts').delete().eq('ip_address', ip)
}
