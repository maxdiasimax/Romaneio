// Script para verificar e criar a tabela vacinas se necessário
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'romaneio.db');
const db = new sqlite3.Database(dbPath);

console.log('Verificando tabela vacinas...\n');

// Verificar se a tabela existe
db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='vacinas'", (err, row) => {
    if (err) {
        console.error('Erro ao verificar tabela:', err.message);
        db.close();
        return;
    }
    
    if (row) {
        console.log('✓ Tabela "vacinas" já existe no banco de dados.');
        
        // Mostrar estrutura da tabela
        db.all("PRAGMA table_info(vacinas)", (err, columns) => {
            if (err) {
                console.error('Erro ao obter estrutura:', err.message);
            } else {
                console.log('\nEstrutura da tabela:');
                columns.forEach(col => {
                    console.log(`  - ${col.name} (${col.type})`);
                });
            }
            
            // Contar registros
            db.get("SELECT COUNT(*) as count FROM vacinas", (err, result) => {
                if (err) {
                    console.error('Erro ao contar registros:', err.message);
                } else {
                    console.log(`\nTotal de registros: ${result.count}`);
                }
                db.close();
            });
        });
    } else {
        console.log('✗ Tabela "vacinas" NÃO existe no banco de dados.');
        console.log('\nCriando tabela...');
        
        // Criar a tabela
        db.run(`CREATE TABLE IF NOT EXISTS vacinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boi_id INTEGER NOT NULL,
            chip TEXT,
            brinco TEXT,
            vacina TEXT NOT NULL,
            data_vacina TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (boi_id) REFERENCES bois(id) ON DELETE CASCADE
        )`, (err) => {
            if (err) {
                console.error('Erro ao criar tabela:', err.message);
            } else {
                console.log('✓ Tabela "vacinas" criada com sucesso!');
            }
            db.close();
        });
    }
});
