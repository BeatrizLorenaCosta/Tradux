const express = require('express');
const { db } = require('../db/connection');
const { verifyToken, verifyRole } = require('../middleware/auth.middleware'); // ✅ importar verifyRole também

const router = express.Router();

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
        const [rows] = await db.query('SELECT id_conta, nome_utilizador, email, username, cargo_id FROM contas');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
