const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const session = require("express-session");

const app = express();

// middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // necessário para PUT
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: "segredo",
    resave: false,
    saveUninitialized: true
}));

// banco
const db = require("./database");

// middleware de proteção
function verificarLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).send("Não autorizado");
    }
    next();
}

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
                console.log("Usuário não encontrado", usuario);
                return res.sendFile(path.join(__dirname, "public", "notfound.html"));
            }

            if (row.senha === senha) {
                req.session.usuario = usuario;

                console.log("Usuário logado com sucesso:", usuario);
                return res.redirect("/kanban");
            } else {
                console.log("Senha incorreta", usuario);
                return res.sendFile(path.join(__dirname, "public", "incorrect.html"));
            }
        }
    );
});

// rota protegida do kanban
app.get("/kanban", (req, res) => {
    if (!req.session.usuario) {
        return res.redirect("/");
    }

    res.sendFile(path.join(__dirname, "views", "kanban.html"));
});

// logout
app.get("/logout", (req, res) => {
    const usuario = req.session.usuario;
    req.session.destroy(() => {
        console.log(`[LOGOUT] ${new Date().toISOString()} - Usuário: ${usuario}`);
        res.redirect("/");
    });
});

// register (página)
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "register.html"));
});

// register (salvar usuário)
app.post("/register", (req, res) => {
    const { usuario, senha } = req.body;

    db.get(
        "SELECT * FROM usuarios WHERE usuario = ?",
        [usuario],
        (err, row) => {
            if (err) return res.send("Erro");

            if (row) {
                return res.sendFile(path.join(__dirname, "public", "exists.html"));
            }

            db.run(
                "INSERT INTO usuarios (usuario, senha) VALUES (?, ?)",
                [usuario, senha],
                function (err) {
                    if (err) return res.send("Erro");

                    return res.sendFile(path.join(__dirname, "public", "created.html"));
                }
            );
        }
    );
});

// CRIAR COLUNA
app.post("/colunas", verificarLogin, (req, res) => {
    const { nome, cor } = req.body;
    const usuario = req.session.usuario;

    db.run(
        "INSERT INTO colunas (nome, ordem, usuario, cor) VALUES (?, ?, ?, ?)",
        [nome, 0, usuario, cor],
        function (err) {
            if (err) return res.send("Erro");

            res.json({ id: this.lastID, nome, cor });
        }
    );
});

// LISTAR COLUNAS
app.get("/colunas", verificarLogin, (req, res) => {
    const usuario = req.session.usuario;

    db.all(
        "SELECT * FROM colunas WHERE usuario = ? ORDER BY ordem",
        [usuario],
        (err, rows) => {
            if (err) return res.send("Erro");

            res.json(rows);
        }
    );
});

// CRIAR CARD
app.post("/cards", verificarLogin, (req, res) => {
    const { titulo, descricao, coluna_id, data_fim } = req.body;
    const usuario = req.session.usuario;

    const criado_em = new Date().toISOString();

    db.run(
        `INSERT INTO cards (titulo, descricao, coluna_id, usuario, criado_em, data_fim) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [titulo, descricao, coluna_id, usuario, criado_em, data_fim],
        function (err) {
            if (err) return res.send("Erro");

            res.json({ id: this.lastID, titulo });
        }
    );
});

// LISTAR CARDS
app.get("/cards", verificarLogin, (req, res) => {
    const usuario = req.session.usuario;

    db.all(
        "SELECT * FROM cards WHERE usuario = ?",
        [usuario],
        (err, rows) => {
            if (err) return res.send("Erro");

            res.json(rows);
        }
    );
});

// ATUALIZAR CARD (drag and drop / edição)
app.put("/cards/:id", verificarLogin, (req, res) => {
    const { titulo, descricao, coluna_id, data_fim } = req.body;
    const usuario = req.session.usuario;

db.run(
    `UPDATE cards 
     SET titulo = COALESCE(?, titulo),
         descricao = COALESCE(?, descricao),
         coluna_id = COALESCE(?, coluna_id),
         data_fim = COALESCE(?, data_fim)
     WHERE id = ? AND usuario = ?`,
    [titulo, descricao, coluna_id, data_fim, req.params.id, usuario],
        function (err) {
            if (err) return res.send("Erro");

            res.send("Card atualizado");
        }
    );
});

app.delete("/cards/:id", verificarLogin, (req, res) => {
    const { id } = req.params;
    const usuario = req.session.usuario;

    db.run(
        "DELETE FROM cards WHERE id = ? AND usuario = ?",
        [id, usuario],
        function (err) {
            if (err) return res.send("Erro");

            res.send("Card deletado");
        }
    );
});

app.put("/colunas/:id", verificarLogin, (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    const usuario = req.session.usuario;

    db.run(
        "UPDATE colunas SET nome = ? WHERE id = ? AND usuario = ?",
        [nome, id, usuario],
        function (err) {
            if (err) return res.send("Erro");

            res.send("Coluna atualizada");
        }
    );
});

app.delete("/colunas/:id", verificarLogin, (req, res) => {
    const { id } = req.params;
    const usuario = req.session.usuario;

    // deleta cards da coluna primeiro
    db.run(
        "DELETE FROM cards WHERE coluna_id = ? AND usuario = ?",
        [id, usuario],
        function (err) {
            if (err) return res.send("Erro ao deletar cards");

            // depois deleta a coluna
            db.run(
                "DELETE FROM colunas WHERE id = ? AND usuario = ?",
                [id, usuario],
                function (err) {
                    if (err) return res.send("Erro ao deletar coluna");

                    res.send("Coluna deletada");
                }
            );
        }
    );
});

app.put("/colunas/:id/ordem", verificarLogin, (req, res) => {
    const { id } = req.params;
    const { ordem } = req.body;
    const usuario = req.session.usuario;

    db.run(
        "UPDATE colunas SET ordem = ? WHERE id = ? AND usuario = ?",
        [ordem, id, usuario],
        function (err) {
            if (err) return res.send("Erro");

            res.send("Ordem atualizada");
        }
    );
});



app.listen(3000, () => {
    console.log("http://localhost:3000");
});