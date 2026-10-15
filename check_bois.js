const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'romaneio.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    console.log('Checking bois table...');
    db.all("SELECT * FROM bois", [], (err, rows) => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Found ${rows.length} records in bois table.`);
            if (rows.length > 0) {
                console.log('First record:', rows[0]);
            }
        }
    });

    // Check schema info
    db.all("PRAGMA table_info(bois)", [], (err, rows) => {
         if (err) {
            console.error(err);
         } else {
             console.log('Schema:', rows);
         }
    });
});

db.close();
