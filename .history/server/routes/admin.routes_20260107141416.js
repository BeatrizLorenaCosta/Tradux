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

// Ultimos documentos recebidos 10
router.get('/ultimos-documentos', verifyToken, async (req, res) => {
    try {
        const [docs ] = await db.query(`
            SELECT 
                d.id_documento,
                d.cliente_id,
                d.estado,
                d.data_envio,
                lo.sigla AS lingua_origem,
                ld.sigla AS lingua_destino
            FROM documentos d
            JOIN linguas lo ON lo.id_lingua = d.lingua_origem
            JOIN linguas ld ON ld.id_lingua = d.lingua_destino
            ORDER BY d.data_envio DESC
            LIMIT 10
        `);

        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Obter documentos do utilizador autenticado
router.get('/me/documentos', verifyToken, async (req, res) => {
    try {
        const [docs] = await db.query(`
            SELECT 
                d.id_documento,
                d.documento_link,
                d.documento_link_final,
                d.estado,
                d.data_envio,
                lo.sigla AS lingua_origem,
                ld.sigla AS lingua_destino
            FROM documentos d
            JOIN linguas lo ON lo.id_lingua = d.lingua_origem
            JOIN linguas ld ON ld.id_lingua = d.lingua_destino
            WHERE d.conta_id = ?
            ORDER BY d.data_envio DESC
        `, [req.user.id]);

        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
