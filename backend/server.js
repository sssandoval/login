const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// banco
const db = require("./database");

db.run(`
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT,
    senha TEXT
)
`);

// página inicial
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

// login
app.post("/login", (req, res) => {
    const { usuario, senha } = req.body;

    db.get(
        "SELECT * FROM usuarios WHERE usuario = ?",
        [usuario],
        (err, row) => {
            if (err) return res.send("Erro");

            if (!row) {
                return res.sendFile(path.join(__dirname, "public", "notfound.html"));
            }

            if (row.senha === senha) {
                return res.sendFile(path.join(__dirname, "public", "logado.html"));
            } else {
                return res.sendFile(path.join(__dirname, "public", "incorrect.html"));
            }
        }
    );
});

// register
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// salvar usuário
app.post("/register", (req, res) => {
    const { usuario, senha } = req.body;

    db.run(
        "INSERT INTO usuarios (usuario, senha) VALUES (?, ?)",
        [usuario, senha],
        function (err) {
            if (err) return res.send("Erro");

        res.sendFile(path.join(__dirname, "public", "created.html"));
        }
    );
});

app.listen(3000, () => {
    console.log("http://localhost:3000");
});