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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    // We can try to select specific columns. If they don't exist, PostgREST will return an error (400 Bad Request: "column does not exist")
    const columnsToTry = {
        fornecedores: ['nome', 'telefone', 'servico', 'contato', 'categoria', 'observacoes'],
        clientes: ['nome', 'tipo', 'telefone', 'endereco'],
        funcionarios: ['nome', 'cargo', 'telefone', 'salario_base', 'data_admissao', 'data_demissao']
    };

    for (const [table, cols] of Object.entries(columnsToTry)) {
        console.log(`\nChecking columns for table: ${table}`);
        for (const col of cols) {
            const { error } = await supabase.from(table).select(col).limit(1);
            if (error) {
                console.log(`  Column "${col}": ❌ ERROR: ${error.message}`);
            } else {
                console.log(`  Column "${col}": ✅ EXISTS`);
            }
        }
    }
}

check();
