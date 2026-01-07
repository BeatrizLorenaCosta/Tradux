const express = require('express');
const router = express.Router();
const { db } = require('../db/connection'); // garante que este db pega os dados do env

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

module.exports = router;
