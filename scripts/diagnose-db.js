const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local manually
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

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
    'funcionarios',
    'clientes',
    'fornecedores',
    'boletos',
    'convenios',
    'caixa', // or 'caixa_entries'?
    'saidas',
    'vales',
    'marmitas'
];

async function diagnose() {
    console.log('🔍 Diagnosing Supabase Tables...');

    for (const table of tablesToCheck) {
        process.stdout.write(`Checking table: ${table}... `);
        const { error } = await supabase.from(table).select('*').limit(1);

        if (error) {
            console.log(`❌ ERROR: ${error.message}`);
        } else {
            console.log(`✅ OK`);
        }
    }
}

diagnose();
