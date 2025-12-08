const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env from root
// Check potential locations for .env.local
const envPath = path.resolve(__dirname, '../../.env.local');
console.log('Loading env from:', envPath);
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars. URL:', !!supabaseUrl, 'Key:', !!serviceKey);
    // Try loading .env if .env.local failed or didn't have keys
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Still missing env vars after checking .env');
        process.exit(1);
    }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
    const email = 'wcyu0527@meeting-room.local';
    const password = '123456';

    console.log(`Setting up admin user: ${email}`);

    // List users to check existence
    // Note: listUsers defaults to page 1, 50 users. If many users, might need pagination. 
    // For now assuming < 50 users.
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    const existing = users.find(u => u.email === email);

    if (existing) {
        console.log('User found. Updating password and role...');
        const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
            password: password,
            app_metadata: { role: 'admin' },
            user_metadata: { full_name: 'Admin' },
            email_confirm: true
        });
        if (updateError) {
            console.error('Update failed:', updateError);
        } else {
            console.log('User updated successfully.');
        }
    } else {
        console.log('User not found. Creating...');
        const { data, error: createError } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            app_metadata: { role: 'admin' },
            user_metadata: { full_name: 'Admin' }
        });

        if (createError) {
            console.error('Creation failed:', createError);
        } else {
            console.log('User created successfully. ID:', data.user.id);
        }
    }
}

main();
