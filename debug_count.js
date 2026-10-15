const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./romaneio.db');

db.serialize(() => {
    // 1. Check total rows in manejo_pasto
    db.get("SELECT COUNT(*) as total FROM manejo_pasto", (err, row) => {
        console.log("Total records in manejo_pasto:", row.total);
    });

    // 2. Check sample data
    db.all("SELECT * FROM manejo_pasto LIMIT 5", (err, rows) => {
        console.log("Sample records:", rows);
    });

    // 3. Test the count query specifically
    // We need a valid pasto_id. Let's get one from the existing records.
    db.all("SELECT DISTINCT pasto_id FROM manejo_pasto LIMIT 1", (err, rows) => {
        if (rows.length > 0) {
            const pastoId = rows[0].pasto_id;
            console.log("Testing query for pasto_id:", pastoId);
            
            const sql = `
                SELECT COUNT(*) as count 
                FROM (
                    SELECT boi_id
                    FROM manejo_pasto m1
                    WHERE id = (
                        SELECT MAX(id) 
                        FROM manejo_pasto m2 
                        WHERE m2.boi_id = m1.boi_id
                    )
                    AND pasto_id = ?
                )
            `;

            db.get(sql, [pastoId], (err, row) => {
                if(err) console.error(err);
                console.log("Computed Count for pasto " + pastoId + ":", row.count);
            });
        } else {
            console.log("No pasto_id found in manejo_pasto to test.");
        }
    });
});
