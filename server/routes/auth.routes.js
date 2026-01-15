const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { db } = require('../db/connection');
require('dotenv').config();

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ message: 'Username e password são obrigatórios' });

    try {
        const [rows] = await db.query('SELECT * FROM contas WHERE username = ?', [username]);
        if (!rows.length) return res.status(404).json({ message: 'Utilizador não encontrado' });

        const user = rows[0];
        const match = await bcrypt.compare(password, user.senha_hash);
        if (!match) return res.status(401).json({ message: 'Password incorreta' });

        const token = jwt.sign(
            { id: user.id_conta, username: user.username, cargo_id: user.cargo_id },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );

        res.json({ token, user: { id: user.id_conta, username: user.username, cargo_id: user.cargo_id } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Signup
router.post('/signup', async (req, res) => {
    const { nome_utilizador, email, username, password } = req.body;
    if (!nome_utilizador || !email || !username || !password)
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });

    try {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO contas (nome_utilizador, email, username, senha_hash) VALUES (?, ?, ?, ?)',
            [nome_utilizador, email, username, hash]
        );
        res.status(201).json({ id: result.insertId, nome_utilizador, email, username });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: 'Email ou username já existe' });
        }
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
