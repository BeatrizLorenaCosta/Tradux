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
        const [equipas] = await db.query(`
             SELECT 
                e.id_equipa,
                e.nome_equipa,
                e.tipo,
                c.id_conta,
                c.nome_utilizador,
                c.email,
                GROUP_CONCAT(l1.sigla, IF(l2.sigla IS NOT NULL, CONCAT(' → ', l2.sigla), '') SEPARATOR ', ') AS linguas
            FROM equipas e
            JOIN equipa_membros em ON em.equipa_id = e.id_equipa
            JOIN contas c ON c.id_conta = em.conta_id
            LEFT JOIN perfis_linguisticos p ON p.conta_id = c.id_conta
            LEFT JOIN linguas l1 ON l1.id_lingua = p.lingua_principal
            LEFT JOIN linguas l2 ON l2.id_lingua = p.lingua_secundaria
            WHERE e.id_equipa = (
                SELECT e2.id_equipa 
                FROM equipas e2
                JOIN equipa_membros em2 ON em2.equipa_id = e2.id_equipa
                WHERE em2.conta_id = ?
                LIMIT 1
            )
            GROUP BY e.id_equipa, c.id_conta
            ORDER BY c.nome_utilizador
        `, [req.user.id]);

        if (!equipas.length) {
            return res.status(404).json({ message: 'Não pertence a nenhuma equipa.' });
        }

        // Retorna info da equipa + membros
        const equipaInfo = {
            id_equipa: equipas[0].id_equipa,
            nome_equipa: equipas[0].nome_equipa,
            tipo: equipas[0].tipo,
            membros: equipas.map(m => ({
                id_conta: m.id_conta,
                nome_utilizador: m.nome_utilizador,
                email: m.email,
                linguas: m.linguas
            }))
        };
        console.log
        res.json(equipaInfo);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter equipas', error: err.message });
    }
});








module.exports = router;
