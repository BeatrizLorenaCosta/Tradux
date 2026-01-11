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

router.get('/me/equipa', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                e.id_equipa,
                e.nome_equipa,
                e.tipo,
                
                c.id_conta AS membro_id,
                c.nome_utilizador AS membro_nome,
                c.email AS membro_email,
                GROUP_CONCAT(l1.sigla, IF(l2.sigla IS NOT NULL, CONCAT(' → ', l2.sigla), '') SEPARATOR ', ') AS linguas_membro,

                d.id_documento,
                d.nome_documento,
                d.documento_link,
                d.documento_link_final,
                d.valor,
                d.paginas,
                d.estado AS estado_documento,
                DATE_FORMAT(d.data_envio, '%d/%m/%Y') AS data_envio,
                cl.nome_utilizador AS cliente_nome,

                lo.sigla AS lingua_origem,
                ld.sigla AS lingua_destino

            FROM equipas e
            JOIN equipa_membros em ON em.equipa_id = e.id_equipa
            JOIN contas c ON c.id_conta = em.conta_id

            LEFT JOIN perfis_linguisticos p ON p.conta_id = c.id_conta
            LEFT JOIN linguas l1 ON l1.id_lingua = p.lingua_principal
            LEFT JOIN linguas l2 ON l2.id_lingua = p.lingua_secundaria

            LEFT JOIN equipa_documentos ed ON ed.equipa_id = e.id_equipa
            LEFT JOIN documentos d ON d.id_documento = ed.documento_id

            LEFT JOIN linguas lo ON lo.id_lingua = d.lingua_origem
            LEFT JOIN linguas ld ON ld.id_lingua = d.lingua_destino

            LEFT JOIN contas cl ON cl.id_conta = d.conta_id

            WHERE e.id_equipa = (
                SELECT e2.id_equipa 
                FROM equipas e2
                JOIN equipa_membros em2 ON em2.equipa_id = e2.id_equipa
                WHERE em2.conta_id = ?
                LIMIT 1
            )
            GROUP BY e.id_equipa, c.id_conta, d.id_documento
            ORDER BY c.nome_utilizador, d.data_envio;
        `, [req.user.id]);

        if (!rows.length) {
            return res.status(404).json({ message: 'Não pertence a nenhuma equipa.' });
        }

        // Agrupar membros (sem duplicar) e documentos (sem duplicar)
        const membrosMap = new Map();
        const documentosMap = new Map();

        rows.forEach(r => {
            // Membros
            if (!membrosMap.has(r.membro_id)) {
                membrosMap.set(r.membro_id, {
                    id_conta: r.membro_id,
                    nome_utilizador: r.membro_nome,
                    email: r.membro_email,
                    linguas_membro: r.linguas_membro
                });
            }

            // Documentos
            if (r.id_documento && !documentosMap.has(r.id_documento)) {
                documentosMap.set(r.id_documento, {
                    id_documento: r.id_documento,
                    nome_documento: r.nome_documento,
                    documento_link: r.documento_link,
                    documento_link_final: r.documento_link_final,
                    valor: r.valor,
                    paginas: r.paginas,
                    estado: r.estado_documento,
                    data_envio: r.data_envio,
                    cliente_nome: r.cliente_nome,
                    linguas_do: `${r.lingua_origem} → ${r.lingua_destino}`
                });
            }
        });

        const equipaInfo = {
            id_equipa: rows[0].id_equipa,
            nome_equipa: rows[0].nome_equipa,
            tipo: rows[0].tipo,
            membros: Array.from(membrosMap.values()),
            documentos: Array.from(documentosMap.values())
        };

        res.json(equipaInfo);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Erro ao obter equipas', error: err.message });
    }
});




module.exports = router;
