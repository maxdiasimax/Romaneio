const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'romaneio.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database ' + dbPath + ': ' + err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        db.run("PRAGMA foreign_keys = ON;");

        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            profile TEXT CHECK(profile IN ('Admin', 'Usuário')) NOT NULL,
            celular TEXT
        )`);

        // Add celular column if it doesn't exist (for existing databases)
        db.run(`ALTER TABLE users ADD COLUMN celular TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding celular column:', err.message);
            }
        });

        // Fazendas Table
        db.run(`CREATE TABLE IF NOT EXISTS fazendas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            address TEXT
        )`);

        // Pastos Table
        db.run(`CREATE TABLE IF NOT EXISTS pastos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            fazenda_id INTEGER NOT NULL,
            FOREIGN KEY (fazenda_id) REFERENCES fazendas(id) ON DELETE CASCADE
        )`);

        // Bois Table
        db.run(`CREATE TABLE IF NOT EXISTS bois (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            initial_weight REAL,
            arrival_date TEXT
        )`);

        // Add new columns to bois table if they don't exist
        db.run(`ALTER TABLE bois ADD COLUMN brinco TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding brinco column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN vendedor TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding vendedor column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN local_compra TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding local_compra column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN valor_boi REAL`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding valor_boi column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN valor_comissao REAL`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding valor_comissao column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN valor_frete REAL`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding valor_frete column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN valor_por_kg REAL`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding valor_por_kg column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN raca TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding raca column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN baixa_id INTEGER`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding baixa_id column:', err.message);
            }
        });

        db.run(`ALTER TABLE bois ADD COLUMN baixa_status TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding baixa_status column:', err.message);
            }
        });

        // Genealogy Columns
        db.run(`ALTER TABLE bois ADD COLUMN pai_id INTEGER`, (err) => {
             if (err && !err.message.includes('duplicate column name')) console.error('Error adding pai_id:', err.message);
        });
        db.run(`ALTER TABLE bois ADD COLUMN mae_id INTEGER`, (err) => {
             if (err && !err.message.includes('duplicate column name')) console.error('Error adding mae_id:', err.message);
        });
        db.run(`ALTER TABLE bois ADD COLUMN sexo TEXT CHECK(sexo IN ('M', 'F'))`, (err) => {
             if (err && !err.message.includes('duplicate column name')) console.error('Error adding sexo:', err.message);
        });
        db.run(`ALTER TABLE bois ADD COLUMN geracao INTEGER`, (err) => {
             if (err && !err.message.includes('duplicate column name')) console.error('Error adding geracao:', err.message);
        });
        db.run(`ALTER TABLE bois ADD COLUMN data_nascimento TEXT`, (err) => {
             if (err && !err.message.includes('duplicate column name')) console.error('Error adding data_nascimento:', err.message);
        });

        // Manejo Pasto Table
        // Stores records of cattle management in a pasture with up to 10 weight records
        db.run(`CREATE TABLE IF NOT EXISTS manejo_pasto (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boi_id INTEGER NOT NULL,
            pasto_id INTEGER NOT NULL,
            fazenda_id INTEGER NOT NULL,
            initial_weight_manejo REAL,
            
            weight_01 REAL, date_weight_01 TEXT,
            weight_02 REAL, date_weight_02 TEXT,
            weight_03 REAL, date_weight_03 TEXT,
            weight_04 REAL, date_weight_04 TEXT,
            weight_05 REAL, date_weight_05 TEXT,
            weight_06 REAL, date_weight_06 TEXT,
            weight_07 REAL, date_weight_07 TEXT,
            weight_08 REAL, date_weight_08 TEXT,
            weight_09 REAL, date_weight_09 TEXT,
            weight_10 REAL, date_weight_10 TEXT,
            
            total_weight_registered REAL, -- Sum of weights
            weights_count INTEGER,       -- Count of weights registered
            
            FOREIGN KEY (boi_id) REFERENCES bois(id) ON DELETE CASCADE,
            FOREIGN KEY (pasto_id) REFERENCES pastos(id) ON DELETE CASCADE,
            FOREIGN KEY (fazenda_id) REFERENCES fazendas(id) ON DELETE CASCADE
        )`);

        // Vacinas Table
        // Stores vaccine application records for cattle
        db.run(`CREATE TABLE IF NOT EXISTS vacinas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boi_id INTEGER NOT NULL,
            chip TEXT,
            brinco TEXT,
            vacina TEXT NOT NULL,
            data_vacina TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (boi_id) REFERENCES bois(id) ON DELETE CASCADE
        )`);

        // Dietas Table
        db.run(`CREATE TABLE IF NOT EXISTS dietas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fazenda_id INTEGER NOT NULL,
            pasto_id INTEGER NOT NULL,
            qtd_bois INTEGER,
            data TEXT NOT NULL,
            dieta_tipo TEXT NOT NULL,
            qtd_kg REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (fazenda_id) REFERENCES fazendas(id) ON DELETE CASCADE,
            FOREIGN KEY (pasto_id) REFERENCES pastos(id) ON DELETE CASCADE
        )`);

        // Baixas Table
        // Stores cattle discharge records (sold or deceased)
        db.run(`CREATE TABLE IF NOT EXISTS baixas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boi_id INTEGER NOT NULL,
            boton TEXT NOT NULL,
            brinco TEXT,
            ultimo_peso REAL,
            data_baixa TEXT NOT NULL,
            status TEXT CHECK(status IN ('Vendido', 'Morreu')) NOT NULL,
            observacao TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (boi_id) REFERENCES bois(id) ON DELETE CASCADE
        )`);

        // Perspectives Table
        db.run(`CREATE TABLE IF NOT EXISTS perspectives (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            boi_id INTEGER NOT NULL,
            fazenda_id INTEGER,
            pasto_id INTEGER,
            start_date TEXT,
            days INTEGER,
            daily_rate REAL,
            initial_weight REAL,
            final_weight REAL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (boi_id) REFERENCES bois(id) ON DELETE CASCADE
        )`);

        // Seed Admin User if not exists
        db.get("SELECT * FROM users WHERE username = ?", ['admin'], (err, row) => {
            if (!row) {
                const salt = bcrypt.genSaltSync(10);
                const hash = bcrypt.hashSync('admin123', salt);
                db.run("INSERT INTO users (name, username, password, profile) VALUES (?, ?, ?, ?)", 
                    ['Administrador', 'admin', hash, 'Admin'], 
                    (err) => {
                        if (err) console.error("Error creating admin user:", err.message);
                        else console.log("Admin user created (user: admin, pass: admin123)");
                    }
                );
            }
        });
    });
}

module.exports = db;
