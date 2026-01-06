const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifica se o token JWT foi fornecido e é válido
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Token inválido' });
    }
};

// Verifica cargo do utilizador
const verifyRole = (roleId) => (req, res, next) => {
    if (req.user.cargo_id !== roleId)
        return res.status(403).json({ message: 'Acesso negado' });
    next();
};

module.exports = { verifyToken, verifyRole };
