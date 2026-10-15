const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config();

const sqliteDbPath = path.resolve(__dirname, 'romaneio.db');
const dbSqlite = new sqlite3.Database(sqliteDbPath, sqlite3.OPEN_READONLY);

const fs = require('fs');

async function migrate() {
    console.log("Starting Migration...");
    
    // Connect without database to create it
    const connectionRaw = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || ''
    });
    
    await connectionRaw.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'romaneio'}`);
    await connectionRaw.end();

    // Now Connect to the database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'romaneio',
        multipleStatements: true
    });

    try {
        // Execute Schema
        console.log("Creating/Verifying Tables...");
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await connection.query(schema);
        // Helper to get SQLite data
        const getSqliteData = (query) => {
            return new Promise((resolve, reject) => {
                dbSqlite.all(query, [], (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                });
            });
        };

        // 1. Users
        console.log("Migrating Users...");
        const users = await getSqliteData("SELECT * FROM users");
        for (const user of users) {
             // Check existence to avoid duplicate admin
            const [rows] = await connection.execute("SELECT id FROM users WHERE username = ?", [user.username]);
            if (rows.length === 0) {
                 await connection.execute(
                    "INSERT INTO users (name, username, password, profile, celular) VALUES (?, ?, ?, ?, ?)",
                    [user.name, user.username, user.password, user.profile, user.celular]
                );
            }
        }

        // 2. Fazendas
        console.log("Migrating Fazendas...");
        const fazendas = await getSqliteData("SELECT * FROM fazendas");
        for (const f of fazendas) {
            await connection.execute(
                "INSERT INTO fazendas (id, name, address) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name",
                [f.id, f.name, f.address]
            );
        }

        // 3. Pastos
        console.log("Migrating Pastos...");
        const pastos = await getSqliteData("SELECT * FROM pastos");
        for (const p of pastos) {
            await connection.execute(
                "INSERT INTO pastos (id, name, fazenda_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE name=name",
                [p.id, p.name, p.fazenda_id]
            );
        }

        // 4. Bois
        console.log("Migrating Bois...");
        const bois = await getSqliteData("SELECT * FROM bois");
        for (const b of bois) {
             // Handle nulls safely
             await connection.execute(
                `INSERT INTO bois (
                    id, name, initial_weight, arrival_date, brinco, vendedor, local_compra, 
                    valor_boi, valor_comissao, valor_frete, valor_por_kg, raca, 
                    baixa_id, baixa_status, pai_id, mae_id, sexo, geracao, data_nascimento
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                ON DUPLICATE KEY UPDATE name=name`,
                [
                    b.id, b.name, b.initial_weight, b.arrival_date, b.brinco, b.vendedor, b.local_compra,
                    b.valor_boi, b.valor_comissao, b.valor_frete, b.valor_por_kg, b.raca,
                    b.baixa_id, b.baixa_status, b.pai_id, b.mae_id, b.sexo, b.geracao, b.data_nascimento
                ]
            );
        }

        // 5. Manejo Pasto
        console.log("Migrating Manejo Pasto...");
        const manejos = await getSqliteData("SELECT * FROM manejo_pasto");
        for (const m of manejos) {
             await connection.execute(
                `INSERT INTO manejo_pasto (
                    id, boi_id, pasto_id, fazenda_id, initial_weight_manejo,
                    weight_01, date_weight_01, weight_02, date_weight_02,
                    weight_03, date_weight_03, weight_04, date_weight_04,
                    weight_05, date_weight_05, weight_06, date_weight_06,
                    weight_07, date_weight_07, weight_08, date_weight_08,
                    weight_09, date_weight_09, weight_10, date_weight_10,
                    total_weight_registered, weights_count
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE boi_id=boi_id`,
                [
                    m.id, m.boi_id, m.pasto_id, m.fazenda_id, m.initial_weight_manejo,
                    m.weight_01, m.date_weight_01, m.weight_02, m.date_weight_02,
                    m.weight_03, m.date_weight_03, m.weight_04, m.date_weight_04,
                    m.weight_05, m.date_weight_05, m.weight_06, m.date_weight_06,
                    m.weight_07, m.date_weight_07, m.weight_08, m.date_weight_08,
                    m.weight_09, m.date_weight_09, m.weight_10, m.date_weight_10,
                    m.total_weight_registered, m.weights_count
                ]
            );
        }

        // 6. Vacinas
        console.log("Migrating Vacinas...");
        const vacinas = await getSqliteData("SELECT * FROM vacinas");
        for (const v of vacinas) {
             await connection.execute(
                "INSERT INTO vacinas (id, boi_id, chip, brinco, vacina, data_vacina, created_at) VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE vacina=vacina",
                [v.id, v.boi_id, v.chip, v.brinco, v.vacina, v.data_vacina, v.created_at]
            );
        }
        
        // 7. Baixas
        console.log("Migrating Baixas...");
        const baixas = await getSqliteData("SELECT * FROM baixas");
        for (const b of baixas) {
             await connection.execute(
                "INSERT INTO baixas (id, boi_id, boton, brinco, ultimo_peso, data_baixa, status, observacao, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status=status",
                [b.id, b.boi_id, b.boton, b.brinco, b.ultimo_peso, b.data_baixa, b.status, b.observacao, b.created_at]
            );
        }

        console.log("Migration Completed Successfully!");

    } catch (err) {
        console.error("Migration Failed:", err);
    } finally {
        await connection.end();
        dbSqlite.close();
    }
}

migrate();
