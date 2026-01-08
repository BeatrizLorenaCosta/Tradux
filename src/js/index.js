import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { supabase } from './supabaseClient.js';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

const BUCKET = 'documentos';

// 🔐 middleware simples (exemplo)
function auth(req, res, next) {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ error: 'Não autenticado' });
  next();
}

app.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'Nenhum ficheiro enviado' });

    if (req.file.mimetype !== 'application/pdf')
      return res.status(400).json({ error: 'Apenas PDF permitido' });

    if (req.file.size > 10 * 1024 * 1024)
      return res.status(400).json({ error: 'Máx. 10MB' });

    const filePath = `temp/${Date.now()}-${req.file.originalname}`;

    const { data, error } = await supabase.storage
      .from('documentos')
      .upload(filePath, req.file.buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (error) throw error;

    console.log('Upload OK:', data.path);

    res.json({ success: true, path: data.path });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
