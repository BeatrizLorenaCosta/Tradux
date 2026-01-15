const express = require('express');
const { db } = require('../db/connection');
const { verifyToken } = require('../middleware/auth.middleware');
const router = express.Router();

// Obter recibo pelo ID
router.get('/:id', verifyToken, async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT
                r.id_recibo,
                d.id_documento,
                r.data_emissao,
                r.data_pagamento,
                c.nome_utilizador AS nome_cliente,
                c.email AS email_cliente,
                r.descricao,
                CONCAT(lo.nome_lingua, ' → ', ld.nome_lingua) AS linguas,
                d.paginas AS quantidade,
                d.valor AS valor_total
            FROM recibos r
            JOIN documentos d ON r.documento_id = d.id_documento
            JOIN contas c ON r.conta_id = c.id_conta
            JOIN linguas lo ON d.lingua_origem = lo.id_lingua
            JOIN linguas ld ON d.lingua_destino = ld.id_lingua
            WHERE r.id_recibo = ?
        `, [id]);

        if (!rows.length) return res.status(404).json({ error: 'Recibo não encontrado' });

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao obter recibo' });
    }
});

// Obter recibo pelo ID do documento
router.get('/documento/:documentoId', verifyToken, async (req, res) => {
    const { documentoId } = req.params;
    const userId = req.user.id;

    try {
        const [rows] = await db.query(`
            SELECT
                r.id_recibo,
                d.id_documento,
                r.data_emissao,
                r.data_pagamento,
                c.nome_utilizador AS nome_cliente,
                c.email AS email_cliente,
                r.descricao,
                CONCAT(lo.nome_lingua, ' → ', ld.nome_lingua) AS linguas,
                d.paginas AS quantidade,
                d.valor AS valor_total
            FROM recibos r
            JOIN documentos d ON r.documento_id = d.id_documento
            JOIN contas c ON r.conta_id = c.id_conta
            JOIN linguas lo ON d.lingua_origem = lo.id_lingua
            JOIN linguas ld ON d.lingua_destino = ld.id_lingua
            WHERE d.id_documento = ? AND r.conta_id = ?
        `, [documentoId, userId]);

        if (!rows.length) return res.status(404).json({ error: 'Recibo não encontrado' });

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao obter recibo' });
    }
});

// Criar recibo
router.post('/', verifyToken, async (req, res) => {
    const {
        documentoId,
        linguaOrigem,
        linguaDestino,
        paginas,
        valor
    } = req.body;

    const userId = req.user.id;

    try {
        const [[user]] = await db.query(
            'SELECT nome_utilizador, email FROM contas WHERE id_conta = ?',
            [userId]
        );

        if (!user) return res.status(404).json({ error: 'Utilizador não encontrado' });

        const [result] = await db.query(`
            INSERT INTO recibos (
                conta_id,
                documento_id,
                data_emissao,
                data_pagamento,
                nome_cliente,
                descricao,
                email_cliente,
                linguas,
                quantidade,
                valor_total
            ) VALUES (
                ?, ?, NOW(), NOW(), ?, ?, ?, ?, ?, ?
            )
        `, [
            userId,
            documentoId,
            user.nome_utilizador,
            'Serviço de tradução',
            user.email,
            `${linguaOrigem} → ${linguaDestino}`,
            paginas,
            valor
        ]);

        res.status(201).json({
            message: 'Recibo criado com sucesso',
            reciboId: result.insertId
        });

    } catch (err) {
        console.error('Erro ao criar recibo:', err);
        res.status(500).json({ error: 'Erro ao criar recibo', details: err.message });
    }
});

module.exports = router;
