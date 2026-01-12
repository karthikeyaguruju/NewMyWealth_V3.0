const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf8');
const envVars = Object.fromEntries(env.split('\n').filter(line => line.includes('=')).map(line => line.split('=')));

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debug() {
    console.log('--- Profiles ---');
    const { data: profiles, error: pError } = await supabase.from('profiles').select('*');
    if (pError) console.error(pError);
    else console.log(JSON.stringify(profiles, null, 2));

    console.log('\n--- Categories ---');
    const { data: categories, error: cError } = await supabase.from('categories').select('*');
    if (cError) console.error(cError);
    else console.log(JSON.stringify(categories, null, 2));
}

debug();
