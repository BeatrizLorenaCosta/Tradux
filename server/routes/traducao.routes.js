const express = require('express');
const { db } = require('../db/connection');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

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
