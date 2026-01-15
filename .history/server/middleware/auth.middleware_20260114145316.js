const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verifica se o token JWT foi fornecido e é válido
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    console.log('Authorization header:', authHeader);

    const token = authHeader?.split(' ')[1];
    console.log('Token extraído:', token);

    if (!token) return res.status(401).json({ message: 'Token não fornecido' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('Erro no JWT:', err);
        return res.status(403).json({ message: 'Token inválido' });
    }
};


// Verifica cargo do utilizador
const verifyRole = (roleId) => (req, res, next) => {
    if (!Array.isArray(roles)) roles = [roles];
    if (req.user.cargo_id !== roleId)
        return res.status(403).json({ message: 'Acesso negado' });
    next();
};

module.exports = { verifyToken, verifyRole };
