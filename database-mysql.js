require('dotenv').config();
const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'romaneio',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true // Important for running schema.sql
});

// Adapter to mimic SQLite API
class Database {
    constructor() {
        this.pool = pool;
        this.initDb();
    }

    run(sql, params, callback) {
        // Handle optional params
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        this.pool.query(sql, params, function(err, results) {
            // Mimic SQLite 'this' context in callback
            const context = {};
            if (results) {
                context.lastID = results.insertId;
                context.changes = results.affectedRows;
            }
            if (callback) {
                callback.call(context, err);
            }
        });
    }

    get(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        this.pool.query(sql, params, function(err, results) {
            if (err) return callback(err);
            // Return first row or undefined
            callback(null, results[0]);
        });
    }

    all(sql, params, callback) {
        if (typeof params === 'function') {
            callback = params;
            params = [];
        }
        params = params || [];

        this.pool.query(sql, params, function(err, results) {
            if (err) return callback(err);
            callback(null, results);
        });
    }

    serialize(callback) {
        // MySQL driver handles concurrency, just run callback
        if (callback) callback();
    }
    
    close() {
        this.pool.end();
    }

    initDb() {
        console.log("Initializing MySQL Database...");
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Check if Admin exists after creating tables
        this.pool.query(schema, (err) => {
            if (err) {
                console.error("Error executing schema:", err);
                return;
            }
            console.log("Schema verified.");
            
            // Seed Admin
            this.get("SELECT * FROM users WHERE username = ?", ['admin'], (err, row) => {
                if (!row) {
                    const salt = bcrypt.genSaltSync(10);
                    const hash = bcrypt.hashSync('admin123', salt);
                    this.run("INSERT INTO users (name, username, password, profile) VALUES (?, ?, ?, ?)", 
                        ['Administrador', 'admin', hash, 'Admin'], 
                        (err) => {
                            if (err) console.error("Error creating admin user:", err.message);
                            else console.log("Admin user created (mysql).");
                        }
                    );
                }
            });
        });
    }
}

const db = new Database();
module.exports = db;
