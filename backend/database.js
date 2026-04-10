const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("banco.db");

db.serialize(() => {
    // TABELA DE USUÁRIOS
    db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario TEXT,
        senha TEXT
    )
    `);

    // TABELA DE COLUNAS
    db.run(`
    CREATE TABLE IF NOT EXISTS colunas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT,
        ordem INTEGER,
        usuario TEXT
    )
    `);

    // TABELA DE CARDS
    db.run(`
    CREATE TABLE IF NOT EXISTS cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        titulo TEXT,
        descricao TEXT,
        coluna_id INTEGER,
        usuario TEXT
    )
    `);
});

module.exports = db;