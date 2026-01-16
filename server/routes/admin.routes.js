const express = require('express');
const { db } = require('../db/connection');
const { verifyToken, verifyRole } = require('../middleware/auth.middleware');

const router = express.Router();

// Obter o nome do admin
router.get('/me', verifyToken, verifyRole(1), async (req, res) => {
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
router.get('/ultimos-documentos', verifyToken, verifyRole(1), async (req, res) => {
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
router.get('/estatisticas', verifyToken, verifyRole(1), async (req, res) => {
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
router.get('/documentos', verifyToken, verifyRole(1), async (req, res) => {
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
router.get('/documentos/:documentoId', verifyToken, verifyRole(1), async (req, res) => {
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
router.put('/documentos/:idDocumento/valor', verifyToken, verifyRole(1), async (req, res) => {
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
router.delete('/documentos/:idDocumento', verifyToken, verifyRole(1), async (req, res) => {
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
                co.cargo_id,
                ca.nome_cargo AS nome_cargo
            FROM contas co
            JOIN cargo ca ON co.cargo_id = ca.id_cargo
        `);
        res.json(rows);
    } catch (err) {
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
router.get('/equipas', verifyToken, verifyRole(1), async (req, res) => {
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

                GROUP_CONCAT(
                    DISTINCT CONCAT('#TRX-', LPAD(ed.documento_id, 4, '0'))
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

router.get('/equipas/:idEquipa', verifyToken, verifyRole(1), async (req, res) => {
    const { idEquipa } = req.params;
    try {
        const [rows] = await db.query(`
            SELECT e.id_equipa,
                e.nome_equipa,
                e.tipo,
                COALESCE(membros.membros_json, JSON_ARRAY()) AS membros,
                COALESCE(documentos.documentos_json, JSON_ARRAY()) AS documentos
            FROM equipas e
            LEFT JOIN (
                SELECT em.equipa_id,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id_conta', c.id_conta,
                            'nome_utilizador', c.nome_utilizador,
                            'lingua_principal', lp.sigla,
                            'lingua_secundaria', ls.sigla
                        )
                    ) AS membros_json
                FROM equipa_membros em
                JOIN contas c ON c.id_conta = em.conta_id
                LEFT JOIN perfis_linguisticos pl ON pl.conta_id = c.id_conta
                LEFT JOIN linguas lp ON lp.id_lingua = pl.lingua_principal
                LEFT JOIN linguas ls ON ls.id_lingua = pl.lingua_secundaria
                GROUP BY em.equipa_id
            ) membros ON membros.equipa_id = e.id_equipa
            LEFT JOIN (
                SELECT ed.equipa_id,
                    JSON_ARRAYAGG(
                        JSON_OBJECT(
                            'id_documento', d.id_documento,
                            'nome_documento', d.nome_documento,
                            'lingua_origem', lo.sigla,
                            'lingua_destino', ld.sigla
                        )
                    ) AS documentos_json
                FROM equipa_documentos ed
                JOIN documentos d ON d.id_documento = ed.documento_id
                LEFT JOIN linguas lo ON lo.id_lingua = d.lingua_origem
                LEFT JOIN linguas ld ON ld.id_lingua = d.lingua_destino
                GROUP BY ed.equipa_id
            ) documentos ON documentos.equipa_id = e.id_equipa
            WHERE e.id_equipa = ?;
        `, [idEquipa]);

        if (!rows.length) return res.status(404).json({ message: 'Equipa não encontrada' });

        // converter JSON arrays
        const equipa = rows[0];
        equipa.membros = equipa.membros || '[]';
        equipa.documentos = equipa.documentos || '[]';

        res.json(equipa);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put('/equipas/:id', verifyToken, verifyRole(1), async (req, res) => {
    const { id } = req.params;
    const { nome_equipa } = req.body;

    try {
        await db.query(`UPDATE equipas SET nome_equipa = ? WHERE id_equipa = ?`, [nome_equipa, id]);
        res.json({ message: 'Equipa atualizada com sucesso' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/equipas/:id/utilizadores/:conta_id', verifyToken, verifyRole(1), async (req, res) => {
    const { id, conta_id } = req.params;

    try {
        await db.query(`DELETE FROM equipa_membros WHERE equipa_id = ? AND conta_id = ?`, [id, conta_id]);
        res.json({ message: 'Membro removido' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/documentos/:id/desassociar', verifyToken, verifyRole(1), async (req, res) => {
    const { id } = req.params;
    const { equipa, estado } = req.body;

    try {
        await db.query(`DELETE FROM equipa_documentos WHERE documento_id = ? AND equipa_id = ?`, [id, equipa]);
        
        const [rows] = await db.query(`SELECT tipo FROM equipas WHERE id_equipa = ?`, [equipa]);
        const tipoEquipa = rows[0]?.tipo;

        if (tipoEquipa) {
            const novoEstado = tipoEquipa === 'tradutores' ? 'pago' : 'traduzido';
            await db.query(`UPDATE documentos SET estado = ? WHERE id_documento = ?`, [novoEstado, id]);
        }
        
        res.json({ message: 'Documento removido da equipa' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Criar equipa
router.post('/equipas', verifyToken, verifyRole(1), async (req, res) => {
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
router.post('/equipas/:idEquipa/utilizadores', verifyToken, verifyRole(1), async (req, res) => {
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

// Eliminar equipa
router.delete('/equipas/:idEquipa', verifyToken, verifyRole(1), async (req, res) => {
    const { idEquipa } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM equipas WHERE id_equipa = ?`,
            [idEquipa]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Equipa não encontrado.' });
        }

        res.json({ message: 'Equipa eliminado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Associar Documento a Equipas
router.post('/documentos/associar', verifyToken, verifyRole(1), async (req, res) => {
    const { documento_id, equipa, responsavel_id  } = req.body;

    if (!documento_id || !equipa || !responsavel_id) {
        return res.status(400).json({ message: 'Dados incompletos.' });
    }

    try {
        const [[equ]] = await db.query(
            `SELECT tipo FROM equipas WHERE id_equipa = ?`,
            [equipa]
        );

        if (!equ) {
            return res.status(404).json({ message: 'Equipa não encontrada.' });
        }

        if (equ.tipo !== 'tradutores' && equ.tipo !== 'revisores') {
            return res.status(400).json({ message: 'Tipos de equipa inválidos.' });
        }

        const [ver] = await db.query(`
            SELECT COUNT(*) AS total
            FROM equipa_documentos
            WHERE equipa_id = ?
        `, [equipa]);

        if (ver[0].total >= 3) {
            return res.status(409).json({ message: 'A equipa já está ocupada.' });
        }

        const [[doc]] = await db.query(
            `SELECT estado FROM documentos WHERE id_documento = ?`,
            [documento_id]
        );

        if (!doc) {
            return res.status(404).json({ message: 'Documento não encontrado.' });
        }

        if (!['pago', 'traduzido'].includes(doc.estado)) {
            return res.status(409).json({
                message: 'Estado do documento não permite associação.'
            });
        }

        await db.query(
            `INSERT INTO equipa_documentos (equipa_id, documento_id, responsavel_upload_id)
             VALUES (?, ?, ?)`,
            [equipa, documento_id, responsavel_id]
        );

        res.status(201).json({
            message: 'Documento associado à equipa.',
            tipo_equipa: equ.tipo
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Documento já associado a esta equipa.'
            });
        }
        res.status(500).json({ message: err.message });
    }
});

// Alterar estado do documento
router.put('/documentos/:id/estado', verifyToken, verifyRole(1), async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;
    let estadoFinal;

    const estadosPermitidos = [
        'traduzido',
        'pago',
        'em_analise'
    ];

    if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
            message: 'Estado inválido.'
        });
    }

    if (estado == 'pago') estadoFinal = 'em_traducao';
    if (estado == 'traduzido') estadoFinal = 'em_revisao';
    if (estado == 'em_analise') estadoFinal = 'a_pagar';

    try {
        const [[doc]] = await db.query(
            `SELECT estado FROM documentos WHERE id_documento = ?`,
            [id]
        );

        if (!doc) {
            return res.status(404).json({
                message: 'Documento não encontrado.'
            });
        }

        await db.query(
            `UPDATE documentos SET estado = ? WHERE id_documento = ?`,
            [estadoFinal, id]
        );

        res.json({
            message: 'Estado do documento atualizado.',
            estadoFinal
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});



// Carregar cargos
router.get('/cargos', verifyToken, verifyRole(1), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_cargo, nome_cargo FROM cargo');
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Adicionar cargos
router.post('/cargos', verifyToken, verifyRole(1), async (req, res) => {
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

router.put('/cargos/:idCargo', verifyToken, verifyRole(1), async (req, res) => {
    const { idCargo } = req.params;
    const { nome_cargo } = req.body;
    if (!nome_cargo) return res.status(400).json({ message: 'Nome do cargo obrigatório' });

    try {
        await db.query(
            `UPDATE cargo SET nome_cargo = ? WHERE id_cargo = ?`,
            [nome_cargo, idCargo]
        );

        res.json({
            message: 'Nome do cargo atualizado.',
            nome_cargo
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/cargos/:idCargo', verifyToken, verifyRole(1), async (req, res) => {
    const { idCargo } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM cargo WHERE id_cargo = ?`,
            [idCargo]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Cargo não encontrado.' });
        }

        res.json({ message: 'Cargo eliminado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


// Carregar linguas
router.get('/linguas', verifyToken, verifyRole(1), async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_lingua, nome_lingua, sigla FROM linguas');
        res.json(rows);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/linguas', verifyToken, verifyRole(1), async (req, res) => {
    const { nome_lingua, sigla } = req.body;
    if (!nome_lingua) return res.status(400).json({ message: 'Nome da lingua obrigatória' });
    if (!sigla) return res.status(400).json({ message: 'Sigla obrigatória' });

    try {
        const [result] = await db.query('INSERT INTO linguas (nome_lingua, sigla) VALUES (?, ?)', [nome_lingua, sigla]);
        res.json({ id: result.insertId, nome_lingua, sigla });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Lingua já existe' });
        res.status(500).json({ message: err.message });
    }
});

router.put('/linguas/:idLingua', verifyToken, verifyRole(1), async (req, res) => {
    const { idLingua } = req.params;
    const { nome_lingua, sigla } = req.body;
    if (!nome_lingua) return res.status(400).json({ message: 'Nome da lingua obrigatória' });
    if (!sigla) return res.status(400).json({ message: 'Sigla obrigatória' });

    try {
        await db.query(
            `UPDATE linguas SET nome_lingua = ?, sigla = ? WHERE id_lingua = ?`,
            [nome_lingua, sigla, idLingua]
        );

        res.json({
            message: 'Lingua atualizada.',
            nome_lingua
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/linguas/:idLingua', verifyToken, verifyRole(1), async (req, res) => {
    const { idLingua } = req.params;

    try {
        const [result] = await db.query(
            `DELETE FROM linguas WHERE id_lingua = ?`,
            [idLingua]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Lingua não encontrado.' });
        }

        res.json({ message: 'Lingua eliminado com sucesso.' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
