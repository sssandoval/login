const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("banco.db");

db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        senha TEXT
    )
    `);
});

module.exports = db;