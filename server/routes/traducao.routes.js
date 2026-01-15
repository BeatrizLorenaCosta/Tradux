const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const { supabase } = require('../supabaseClient');
const { db } = require('../db/connection');

const router = express.Router();

// multer em memória
const upload = multer({ storage: multer.memoryStorage() });

// nome do bucket (confere no Supabase)
const BUCKET = 'Documentos';

/* =========================
   GET línguas
========================= */
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

/* =========================
   POST upload PDF
========================= */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    /* ---------- token ---------- */
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não enviado' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.decode(token);

    if (!decoded || !decoded.sub) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    const userId = decoded.sub; // ✅ ID do utilizador Supabase

    /* ---------- ficheiro ---------- */
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhum ficheiro enviado' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'Apenas ficheiros PDF' });
    }

    if (req.file.size > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'Máximo 10MB' });
    }

    /* ---------- nome seguro ---------- */
    const originalName = req.file.originalname;
    const safeName = originalName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    // 📂 estrutura: userId/timestamp_nome.pdf
    const filePath = `${userId}/${Date.now()}_${safeName}`;

    /* ---------- upload Supabase ---------- */
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) {
      console.error('Erro Supabase:', error);
      throw error;
    }

    console.log('Upload OK:', data.path);

    res.json({
      success: true,
      path: data.path,
      userId
    });

  } catch (err) {
    console.error('Erro upload:', err);
    res.status(500).json({ error: 'Erro interno no upload' });
  }
});

module.exports = router;
