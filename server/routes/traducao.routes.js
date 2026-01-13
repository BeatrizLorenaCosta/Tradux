const express = require('express');
const multer = require('multer');
const { supabase } = require('../supabaseClient');
const router = express.Router();
const { db } = require('../db/connection'); 
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET = 'Documentos';
const { verifyToken } = require('../middleware/auth.middleware');

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
        res.status(500).json({ message: err.message });
    }
});

// =======================
// UPLOAD DOCUMENTO
// =======================
router.post('/upload', verifyToken, upload.single('file'), async (req, res) => {
  const { origem, destino, paginas } = req.body;
  const contaId = req.user.id; // id da conta logada

  try {
    console.log('Conta logada:', req.user);

    // Validações do ficheiro
    if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    if (req.file.mimetype !== 'application/pdf') return res.status(400).json({ error: 'Apenas PDF permitido' });
    if (req.file.size > 10 * 1024 * 1024) return res.status(400).json({ error: 'Máx. 10MB' });

    // Validar IDs das línguas
    const origemId = parseInt(origem, 10);
    const destinoId = parseInt(destino, 10);
    const numPaginas = parseInt(paginas, 10) || 0;

    if (isNaN(origemId) || isNaN(destinoId)) {
      return res.status(400).json({ error: 'ID de língua inválido' });
    }

    // Caminho no Supabase
    const filePath = `temp/${Date.now()}-${req.file.originalname}`;
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, req.file.buffer, { contentType: 'application/pdf', upsert: false });
    if (error) throw error;

    // URL público
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    // Inserir na tabela documentos
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

    res.json({ success: true, documento_link: publicUrlData.publicUrl });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
