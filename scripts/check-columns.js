const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    for (const table of ['funcionarios', 'clientes', 'fornecedores']) {
        console.log(`\n--- COLUMNS FOR TABLE: ${table} ---`);
        // Let's run a query to RPC or select columns from information_schema if possible?
        // Wait, standard Supabase anonym key might not have access to select from information_schema.
        // Let's try inserting a dummy row with wrong fields or catching the error of insert.
        const { error } = await supabase.from(table).insert({}).select();
        if (error) {
            console.error(`Insert empty row error:`, error.message, error.details, error.hint);
        }
    }
}

check();
