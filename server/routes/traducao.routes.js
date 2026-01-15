const express = require('express');
const multer = require('multer');
const { supabase } = require('../supabaseClient');
const { db } = require('../db/connection');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

// multer em memória
const upload = multer({ storage: multer.memoryStorage() });

// nome do bucket no Supabase
const BUCKET = 'Documentos';

// =======================
// GET LÍNGUAS
// =======================
router.get('/linguas', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id_lingua, nome_lingua FROM linguas ORDER BY nome_lingua'
    );
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar línguas:', err);
    res.status(500).json({ error: 'Erro ao buscar línguas' });
  }
});

// =======================
// UPLOAD DOCUMENTO (PDF)
// =======================
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  const { origem, destino, paginas } = req.body;
  const contaId = req.user.id;

  try {
    // validações do ficheiro
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Apenas ficheiros PDF' });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Máximo 10MB' });
    }

    // validações das línguas
    const origemId = parseInt(origem, 10);
    const destinoId = parseInt(destino, 10);
    const numPaginas = parseInt(paginas, 10) || 0;

    if (isNaN(origemId) || isNaN(destinoId)) {
      return res.status(400).json({ error: 'ID de língua inválido' });
    }

    // nome seguro
    const safeName = req.file.originalname
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const filePath = `temp/${Date.now()}_${safeName}`;

    // upload para o Supabase
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    // URL público
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    // inserir na BD
    await db.query(
      `INSERT INTO documentos
      (nome_documento, documento_link, documento_link_final, lingua_origem, lingua_destino, valor, paginas, estado, erros_encontrados, conta_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.file.originalname,
        publicUrlData.publicUrl,
        null,
        origemId,
        destinoId,
        0,
        numPaginas,
        'em_analise',
        null,
        contaId
      ]
    );

    res.json({
      success: true,
      documento_link: publicUrlData.publicUrl
    });

  } catch (err) {
    console.error('Erro upload:', err);
    res.status(500).json({ error: 'Erro interno no upload' });
  }
});

module.exports = router;
