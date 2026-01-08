const express = require('express');
const multer = require('multer');
const { supabase } = require('../supabaseClient');
const router = express.Router();
const { db } = require('../db/connection'); // garante que este db pega os dados do env
const upload = multer({ storage: multer.memoryStorage() });
const BUCKET = 'Documentos';

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
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Apenas PDF permitido' });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Máx. 10MB' });
    }

    const filePath = `temp/${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    console.log('Upload OK:', data.path);

    res.json({
      success: true,
      path: data.path
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
