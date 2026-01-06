const express = require('express');
const { db } = require('../db/connection');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();



// Obter dados do próprio utilizador
router.get('/me', verifyToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id_conta, nome_utilizador, email, username, cargo_id FROM contas WHERE id_conta = ?', [req.user.id]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
//Update

module.exports = router;
