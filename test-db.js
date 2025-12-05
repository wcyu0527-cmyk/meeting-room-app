const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing environment variables.');
    console.log('URL:', supabaseUrl);
    console.log('Key:', supabaseKey ? 'Set' : 'Not Set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to Supabase...');
    const { data, error } = await supabase.from('rooms').select('*');

    if (error) {
        console.error('Connection failed:', error.message);
    } else {
        console.log('Connection successful!');
        console.log('Rooms found:', data.length);
        if (data.length > 0) {
            console.log('First room:', data[0].name);
        } else {
            console.log('Warning: No rooms found in the database. Did you run the schema.sql script?');
        }
    }
}

testConnection();
