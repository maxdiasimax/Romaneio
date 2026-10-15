const db = require('./database');

// Wait for DB connection and init
setTimeout(() => {
    console.log("Starting CRUD Tests for Baixas...");
    runTests();
}, 2000);

function runTests() {
    db.serialize(() => {
        // 1. Get a valid Boi ID
        db.get("SELECT id FROM bois LIMIT 1", (err, boi) => {
            if (err) {
                console.error("Error fetching boi:", err);
                process.exit(1);
            }

            let boiId;
            if (!boi) {
                console.log("No bois found. Creating a test boi...");
                db.run("INSERT INTO bois (name, initial_weight) VALUES ('Test Boi CRUD', 500)", function(err) {
                    if (err) {
                        console.error("Failed to create test boi:", err);
                        process.exit(1);
                    }
                    boiId = this.lastID;
                    performCrud(boiId);
                });
            } else {
                boiId = boi.id;
                console.log(`Using existing Boi ID: ${boiId}`);
                performCrud(boiId);
            }
        });
    });
}

function performCrud(boiId) {
    let baixaId;

    // CREATE
    const insertSql = `INSERT INTO baixas (boi_id, boton, data_baixa, status, observacao) VALUES (?, ?, ?, ?, ?)`;
    db.run(insertSql, [boiId, 'TEST_BTN_01', '2025-12-09', 'Vendido', 'Test create'], function(err) {
        if (err) {
            console.error("Create Baixa Failed:", err.message);
            // If table missing, this will fail
            return;
        }
        baixaId = this.lastID;
        console.log(`[PASS] Create Baixa - New ID: ${baixaId}`);

        // READ
        db.get("SELECT * FROM baixas WHERE id = ?", [baixaId], (err, row) => {
            if (err) {
                console.error("Read Baixa Failed:", err.message);
                return;
            }
            if (row && row.observacao === 'Test create') {
                console.log(`[PASS] Read Baixa - Verified data: ${row.observacao}`);
            } else {
                console.error(`[FAIL] Read Baixa - Row mismatch:`, row);
            }

            // UPDATE
            db.run("UPDATE baixas SET observacao = 'Test update' WHERE id = ?", [baixaId], function(err) {
                if (err) {
                    console.error("Update Baixa Failed:", err.message);
                    return;
                }
                console.log(`[PASS] Update Baixa - Rows affected: ${this.changes}`);

                // DELETE
                db.run("DELETE FROM baixas WHERE id = ?", [baixaId], function(err) {
                    if (err) {
                        console.error("Delete Baixa Failed:", err.message);
                        return;
                    }
                    console.log(`[PASS] Delete Baixa - Rows affected: ${this.changes}`);
                    
                    console.log("All CRUD tests completed.");
                    process.exit(0);
                });
            });
        });
    });
}
