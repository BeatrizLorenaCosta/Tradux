const express = require('express');
const { db } = require('../db/connection');
const { verifyToken, verifyRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Obter o nome do admin
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT nome_utilizador FROM contas WHERE id_conta = ?', [req.user.id]);
        if (!rows.length) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Apenas admins podem criar cargos
router.post('/cargo', verifyToken, verifyRole(1), async (req, res) => {
    const { nome_cargo } = req.body;
    if (!nome_cargo) return res.status(400).json({ message: 'Nome do cargo obrigatório' });

    try {
        const [result] = await db.query('INSERT INTO cargo (nome_cargo) VALUES (?)', [nome_cargo]);
        res.json({ id: result.insertId, nome_cargo });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Cargo já existe' });
        res.status(500).json({ message: err.message });
    }
});

// Listar todos os utilizadores
router.get('/users', verifyToken, verifyRole(1), async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                co.id_conta,
                co.nome_utilizador,
                co.email,
                co.username,
                ca.nome_cargo AS nome_cargo
            FROM contas co
            JOIN cargo ca ON co.cargo_id = ca.id_cargo
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Listar documentos pendentes
router.get('/pendentes', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM documentos WHERE estado = "em_analise"');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Atribuir documento a equipa/tradutor
router.post('/atribuir', verifyToken, async (req, res) => {
    const { documento_id, conta_id } = req.body;
    if (!documento_id || !conta_id) return res.status(400).json({ message: 'Documento e conta obrigatórios' });

    try {
        const [result] = await db.query(
            'INSERT INTO equipas (conta_id, documento_id) VALUES (?, ?)',
            [conta_id, documento_id]
        );
        res.json({ id: result.insertId, documento_id, conta_id });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




module.exports = router;
