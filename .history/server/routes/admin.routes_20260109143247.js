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



/* Dashboard admin */
// Últimos documentos enviados
router.get('/ultimos-documentos', verifyToken, async (req, res) => {
    try {
        const [docs ] = await db.query(`
            SELECT 
                d.id_documento,
                d.nome_documento,
                c.nome_utilizador AS cliente_nome,
                d.estado,
                d.data_envio,
                lo.sigla AS lingua_origem,
                ld.sigla AS lingua_destino
            FROM documentos d
            JOIN linguas lo ON lo.id_lingua = d.lingua_origem
            JOIN linguas ld ON ld.id_lingua = d.lingua_destino
            JOIN contas c ON c.id_conta = d.conta_id
            ORDER BY d.data_envio DESC
            LIMIT 10
        `);

        res.json(docs);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Estatísticas gerais
router.get('/estatisticas', verifyToken, async (req, res) => {
    try {
        const [[{ documentos_hoje }]] = await db.query('SELECT COUNT(*) AS documentos_hoje FROM documentos WHERE DATE(data_envio) = CURDATE()');
        const [[{ total_documentos }]] = await db.query('SELECT COUNT(*) AS total_documentos FROM documentos');
        const [[{ total_utilizadores }]] = await db.query('SELECT COUNT(*) AS total_utilizadores FROM contas');
        const [[{ documentos_em_analise }]] = await db.query('SELECT COUNT(*) AS documentos_em_analise FROM documentos WHERE estado = "em_analise"');
        res.json({ documentos_hoje, total_documentos, total_utilizadores, documentos_em_analise });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



/* Documentos admin */
// Listar documentos
router.get('/documentos', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                d.id_documento,
                d.nome_documento,
                c.nome_utilizador AS cliente_nome,
                d.estado,
                d.data_envio,
                d.valor,
                lo.sigla AS lingua_origem,
                ld.sigla AS lingua_destino,

                GROUP_CONCAT(DISTINCT e.nome_equipa
                    ORDER BY e.nome_equipa
                    SEPARATOR ', '
                ) AS equipas

            FROM documentos d
            JOIN linguas lo ON lo.id_lingua = d.lingua_origem
            JOIN linguas ld ON ld.id_lingua = d.lingua_destino
            JOIN contas c ON c.id_conta = d.conta_id
            LEFT JOIN equipa_documentos ed ON ed.documento_id = d.id_documento
            LEFT JOIN equipas e ON e.id_equipa = ed.equipa_id
            
            GROUP BY
                d.id_documento,
                d.nome_documento,
                c.nome_utilizador,
                d.estado,
                d.data_envio,
                lo.sigla,
                ld.sigla;

        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Receber dados de um documento específico
router.get('/documentos/:documentoId', verifyToken, async (req, res) => {
    const { documentoId } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT
                d.id_documento,
                d.nome_documento,
                d.valor,
                lo.sigla AS lingua_origem,
                ld.sigla AS lingua_destino
            FROM documentos d
            JOIN linguas lo ON lo.id_lingua = d.lingua_origem
            JOIN linguas ld ON ld.id_lingua = d.lingua_destino
            WHERE d.id_documento = ?
        `, [documentoId]);

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Alterar valor do documento
router.put('/documentos/:idDocumento/valor', verifyToken, async (req, res) => {
    const { idDocumento } = req.params;
    const { valor } = req.body;

    if (valor === undefined) {
        return res.status(400).json({ message: 'Valor é obrigatório.' });
    }

    try {
        const [result] = await db.query(
            `UPDATE documentos SET valor = ? WHERE id_documento = ?`,
            [valor, idDocumento]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }

        res.json({ message: 'Valor atualizado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Eliminar documento
router.delete('/documentos/:idDocumento', verifyToken, async (req, res) => {
    const { idDocumento } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM documentos WHERE id_documento = ? AND estado = 'cancelado'`,
            [idDocumento]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }

        res.json({ message: 'Documento eliminado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});




/* Utilizadores admin */
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

// Carregar cargos
router.get('/cargos', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_cargo, nome_cargo FROM cargo');
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Receber dados de um utilizador específico
router.get('/users/:userId', verifyToken, verifyRole(1), async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT
                co.id_conta,
                co.nome_utilizador,
                co.email,
                co.username,
                co.cargo_id
            FROM contas co
            WHERE co.id_conta = ?
        `, [userId]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Alterar cargo do utilizador
router.put('/users/:idConta/cargo', verifyToken, verifyRole(1), async (req, res) => {
    const { idConta } = req.params;
    const { cargo_id } = req.body;
    
    if (!cargo_id) {
        return res.status(400).json({ message: 'Cargo_id é obrigatório.' });
    }

    try {
        const [result] = await db.query(
            `UPDATE contas SET cargo_id = ? WHERE id_conta = ?`,
            [cargo_id, idConta]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        res.json({ message: 'Cargo atualizado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Eliminar utilizador
router.delete('/users/:idConta', verifyToken, verifyRole(1), async (req, res) => {
    const { idConta } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM contas WHERE id_conta = ?`,
            [idConta]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }

        res.json({ message: 'Utilizador eliminado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



/* Equipas admin */
// Listar equipas
router.get('/equipas', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                e.id_equipa,
                e.nome_equipa,
                e.tipo,

                GROUP_CONCAT(DISTINCT c.nome_utilizador
                    ORDER BY c.nome_utilizador
                    SEPARATOR ', '
                ) AS membros,

                GROUP_CONCAT(DISTINCT l.nome_lingua
                    ORDER BY l.nome_lingua
                    SEPARATOR ', '
                ) AS linguas,

                GROUP_CONCAT(DISTINCT l.sigla
                    ORDER BY l.sigla
                    SEPARATOR ', '
                ) AS siglas_linguas,

                GROUP_CONCAT(DISTINCT ed.documento_id
                     ORDER BY ed.documento_id
                     SEPARATOR ', '
                ) AS documentos,

                COUNT(DISTINCT ed.documento_id) AS total_documentos,

                CASE
                    WHEN COUNT(DISTINCT ed.documento_id) >= 3 THEN TRUE
                    ELSE FALSE
                END AS ocupada

            FROM equipas e
            LEFT JOIN equipa_membros em ON em.equipa_id = e.id_equipa
            LEFT JOIN contas c ON c.id_conta = em.conta_id
            LEFT JOIN perfis_linguisticos pl ON pl.conta_id = c.id_conta
            LEFT JOIN linguas l ON l.id_lingua IN (pl.lingua_principal, pl.lingua_secundaria)
            LEFT JOIN equipa_documentos ed ON ed.equipa_id = e.id_equipa
            GROUP BY e.id_equipa, e.nome_equipa, e.tipo`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Criar equipa
router.post('/equipas', verifyToken, async (req, res) => {
    const { nome_equipa, tipo } = req.body;

    if (!nome_equipa || !tipo) {
        return res.status(400).json({ message: 'Dados em falta.' });
    }

    try {
        await db.query(
            `INSERT INTO equipas (nome_equipa, tipo) VALUES (?, ?)`,
            [nome_equipa, tipo]
        );

        res.status(201).json({ message: 'Equipa criada com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Adicionar Utilizador à Equipa
router.post('/equipas/:idEquipa/utilizadores', verifyToken, async (req, res) => {
    const { idEquipa } = req.params;
    const { conta_id } = req.body;

    try {
        // Tipo da equipa
        const [[equipa]] = await db.query(
            `SELECT tipo FROM equipas WHERE id_equipa = ?`,
            [idEquipa]
        );

        if (!equipa) {
            return res.status(404).json({ message: 'Equipa não encontrada.' });
        }

        // Verificar cargo do utilizador
        const [[conta]] = await db.query(
            `SELECT cargo_id FROM contas WHERE id_conta = ?`,
            [conta_id]
        );

        const cargoEsperado =
            equipa.tipo === 'tradutores' ? 3 : 4;

        if (!conta || conta.cargo_id !== cargoEsperado) {
            return res.status(400).json({
                message: 'Utilizador incompatível com o tipo de equipa.'
            });
        }

        // Inserir membro
        await db.query(
            `INSERT INTO equipa_membros (equipa_id, conta_id)
             VALUES (?, ?)`,
            [idEquipa, conta_id]
        );

        res.json({ message: 'Utilizador adicionado à equipa.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Utilizador já pertence a esta equipa.'
            });
        }
        res.status(500).json({ message: err.message });
    }
});

// Associar Documento a Equipas
router.post('/documentos/associar', verifyToken, async (req, res) => {
    const { documento_id, equipa } = req.body;

    if (!documento_id || !equipa) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }

    const [[equ]] = await db.query(
        `SELECT tipo FROM equipas WHERE id_equipa = ?`,
        [equipa]
    );

    if (!equ) {
        return res.status(404).json({
            message: 'Equipa não encontrada.'
        });
    }

    if (equ.tipo !== 'tradutores' && equ.tipo !== 'revisores') {
        return res.status(400).json({
            message: 'Tipos de equipa inválidos.'
        });
    }


    try {
        // Verificar ocupação das equipas
        const [ver] = await db.query(`
            SELECT COUNT(ed.documento_id) AS total
            FROM equipas e
            LEFT JOIN equipa_documentos ed ON ed.equipa_id = e.id_equipa
            WHERE e.id_equipa = ?
        `, [equipa]);

        const { total } = ver[0];

        if (total >= 3) {
            return res.status(409).json({
                message: 'A equipa já está ocupada.'
            });
        }

        const [[doc]] = await db.query(
            `SELECT id_documento, estado FROM documentos WHERE id_documento = ?`,
            [documento_id]
        );

        if (!doc) {
            return res.status(404).json({
                message: 'Documento não encontrado.'
            });
        }

        if (!['em_analise', 'traduzido'].includes(doc.estado)) {
            return res.status(409).json({
                message: 'Estado do documento não permite associação.'
            });
        }

        // Associar documento
        await db.query(
            `INSERT INTO equipa_documentos (equipa_id, documento_id)
             VALUES (?, ?)`,
            [
                equipa, documento_id
            ]
        );
        

        res.json({ message: 'Documento associado a equipa.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Documento já associado a esta equipa.'
            });
        }
        res.status(500).json({ message: err.message });
    }
});

// alterar o estado do docume



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
