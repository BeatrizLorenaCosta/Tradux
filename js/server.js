const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "", // ajusta
    database: "traduxBd"
});

db.connect(err => {
    if (err) {
        console.error("Erro MySQL:", err);
        return;
    }
    console.log("MySQL ligado com sucesso");
});

app.listen(3000, () => {
    console.log("API a correr em http://localhost:3000");
});

// GET
app.get("/cargo", (req, res) => {
    db.query("SELECT * FROM cargo", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

// POST
app.post("/cargo", (req, res) => {
    db.query("INSERT INTO cargo (cargo) VALUES (?)",
        [req.body.cargo],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        });
});

// PUT
app.put("/cargo/:id", (req, res) => {
    db.query("UPDATE cargo SET cargo=? WHERE ID_Cargo=?",
        [req.body.cargo, req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
});

// DELETE
app.delete("/cargo/:id", (req, res) => {
    db.query("DELETE FROM cargo WHERE ID_Cargo=?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
});

app.get("/contas", (req, res) => {
    db.query("SELECT * FROM contas", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.post("/contas", (req, res) => {
    const { email, password, username, nome, ID_Cargo } = req.body;
    db.query(
        "INSERT INTO contas (email,password,username,nome,ID_Cargo) VALUES (?,?,?,?,?)",
        [email, password, username, nome, ID_Cargo],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        }
    );
});

app.put("/contas/:id", (req, res) => {
    db.query(
        "UPDATE contas SET email=?, username=?, nome=?, ID_Cargo=? WHERE ID_conta=?",
        [req.body.email, req.body.username, req.body.nome, req.body.ID_Cargo, req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        }
    );
});

app.delete("/contas/:id", (req, res) => {
    db.query("DELETE FROM contas WHERE ID_conta=?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
});

app.get("/linguas", (req, res) => {
    db.query("SELECT * FROM linguas", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.post("/linguas", (req, res) => {
    db.query("INSERT INTO linguas (lingua) VALUES (?)",
        [req.body.lingua],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        });
});

app.put("/linguas/:id", (req, res) => {
    db.query("UPDATE linguas SET lingua=? WHERE ID_linguas=?",
        [req.body.lingua, req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
});

app.delete("/linguas/:id", (req, res) => {
    db.query("DELETE FROM linguas WHERE ID_linguas=?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
});

app.get("/documentos", (req, res) => {
    db.query("SELECT * FROM documentos_sistema", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.post("/documentos", (req, res) => {
    const d = req.body;
    db.query(
        `INSERT INTO documentos_sistema 
    (ID_conta, linguas_ID_linguas, lingua_original, documento_url, doc_enviado)
    VALUES (?,?,?,?,1)`,
        [d.ID_conta, d.linguas_ID_linguas, d.lingua_original, d.documento_url],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        }
    );
});

app.put("/documentos/:id", (req, res) => {
    db.query(
        "UPDATE documentos_sistema SET doc_traduzido=?, doc_revisado=?, doc_finalizado=? WHERE ID_Documento=?",
        [
            req.body.doc_traduzido,
            req.body.doc_revisado,
            req.body.doc_finalizado,
            req.params.id
        ],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        }
    );
});

app.delete("/documentos/:id", (req, res) => {
    db.query("DELETE FROM documentos_sistema WHERE ID_Documento=?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
});

app.get("/tradutores", (req, res) => {
    db.query("SELECT * FROM tradutores", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});

app.post("/tradutores", (req, res) => {
    db.query(
        "INSERT INTO tradutores (ID_conta, lingua_principal, lingua_secundaria) VALUES (?,?,?)",
        [req.body.ID_conta, req.body.lingua_principal, req.body.lingua_secundaria],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        }
    );
});

app.delete("/tradutores/:id", (req, res) => {
    db.query("DELETE FROM tradutores WHERE ID_tradutor=?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        });
});


app.get("/revisores", (req, res) => {
    db.query("SELECT * FROM revisores", (err, rows) => {
        if (err) return res.status(500).json(err);
        res.json(rows);
    });
});


app.get("/revisores/:id", (req, res) => {
    db.query(
        "SELECT * FROM revisores WHERE ID_revisor = ?",
        [req.params.id],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            res.json(rows[0] || {});
        }
    );
});

app.post("/revisores", (req, res) => {
    const { ID_conta, lingua_principal, lingua_secundaria } = req.body;

    db.query(
        "INSERT INTO revisores (ID_conta, lingua_principal, lingua_secundaria) VALUES (?,?,?)",
        [ID_conta, lingua_principal, lingua_secundaria],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ id: result.insertId });
        }
    );
});

app.put("/revisores/:id", (req, res) => {
    const { lingua_principal, lingua_secundaria } = req.body;

    db.query(
        "UPDATE revisores SET lingua_principal = ?, lingua_secundaria = ? WHERE ID_revisor = ?",
        [lingua_principal, lingua_secundaria, req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        }
    );
});


app.delete("/revisores/:id", (req, res) => {
    db.query(
        "DELETE FROM revisores WHERE ID_revisor = ?",
        [req.params.id],
        err => {
            if (err) return res.status(500).json(err);
            res.json({ success: true });
        }
    );
});

