
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('romaneio.db');

const ID_TO_DELETE = 13;

console.log(`Debug: Attempting to delete Pasto ID ${ID_TO_DELETE}`);

// 1. Check if it exists
db.get("SELECT * FROM pastos WHERE id = ?", [ID_TO_DELETE], (err, row) => {
    if (err) { console.error("Error fetching:", err); return; }
    if (!row) { console.log("Pasto does not exist initially."); }
    else { console.log("Pasto exists:", row); }

    // 2. Check FK status
    db.get("PRAGMA foreign_keys", (err, row) => {
        console.log("Foreign Keys setting:", row);

        // 3. Try Delete
        db.run("DELETE FROM pastos WHERE id = ?", [ID_TO_DELETE], function(err) {
            if (err) {
                console.error("DELETE ERROR:", err);
            } else {
                console.log("DELETE Result - Changes:", this.changes);
            }

            // 4. Verify
            db.get("SELECT * FROM pastos WHERE id = ?", [ID_TO_DELETE], (err, row) => {
                if (!row) console.log("Verified: Pasto is gone.");
                else console.log("FAILURE: Pasto still exists.");
            });
        });
    });
});
