import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
    console.error('Error: Missing NEXT_PUBLIC_SUPABASE_URL in .env.local')
    process.exit(1)
}

if (!supabaseServiceKey) {
    console.error('Error: Missing SUPABASE_SERVICE_ROLE_KEY in .env.local')
    console.error('Please go to your Supabase Dashboard -> Project Settings -> API -> service_role secret')
    console.error('And add it to your .env.local file as SUPABASE_SERVICE_ROLE_KEY=your_key_here')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const inputUsername = process.argv[2]
const password = process.argv[3]

if (!inputUsername || !password) {
    console.error('Usage: npx tsx scripts/create-admin.ts <username> <password>')
    process.exit(1)
}

// If username is not an email, append a default domain
const email = inputUsername.includes('@') ? inputUsername : `${inputUsername}@meeting.local`

async function createAdmin() {
    console.log(`Creating admin user: ${email} (Username: ${inputUsername})`)

    // 1. Create user
    const { data: { user }, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: inputUsername
        }
    })

    if (createError) {
        console.error('Error creating user:', createError.message)
        return
    }

    if (!user) {
        console.error('Error: User not created')
        return
    }

    console.log('User created successfully. ID:', user.id)

    // 2. Update profile role to admin
    // The trigger should have created the profile, but we might need to wait or update it.
    // We can upsert to be sure.
    const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', user.id)

    if (updateError) {
        console.error('Error updating profile role:', updateError.message)
        // Try inserting if it doesn't exist (trigger might have failed or been slow)
        const { error: insertError } = await supabase
            .from('profiles')
            .upsert({
                id: user.id,
                role: 'admin',
                full_name: inputUsername
            })

        if (insertError) {
            console.error('Error inserting/upserting profile:', insertError.message)
            return
        }
    }

    console.log('Successfully granted admin privileges to', email)
}

createAdmin()
