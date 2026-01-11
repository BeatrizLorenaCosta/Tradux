const express = require('express');
const { db } = require('../db/connection');
const { verifyToken } = require('../middleware/auth.middleware');
const bcrypt = require('bcrypt');

const router = express.Router();



// Obter dados do utilizador autenticado
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id_conta,
                nome_utilizador,
                email,
                username,
                cargo_id
            FROM contas
            WHERE id_conta = ?
        `, [req.user.id]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Utilizador não encontrado' });
        }

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/me', verifyToken, async (req, res) => {
    const { nome_utilizador, email, password } = req.body;

    try {
        if (password) {
            const senha_hash = await bcrypt.hash(password, 10);

            await db.query(`
                UPDATE contas
                SET nome_utilizador = ?, email = ?, senha_hash = ?
                WHERE id_conta = ?
            `, [nome_utilizador, email, senha_hash, req.user.id]);
        } else {
            await db.query(`
                UPDATE contas
                SET nome_utilizador = ?, email = ?
                WHERE id_conta = ?
            `, [nome_utilizador, email, req.user.id]);
        }

        res.json({ message: 'Dados atualizados com sucesso' });
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
                d.nome_documento,
                d.valor,
                d.paginas,
                d.documento_link,
                d.documento_link_final,
                d.estado,
                d.paginas,
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
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter documentos', error: err.message });
    }
});

router.get('me/equipa', verifyToken, async (req, res) => {
    try {

    } catch (er)
});








module.exports = router;
