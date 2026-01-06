const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const traducaoRoutes = require('./routes/traducao.routes');

const app = express();

app.use(cors());
app.use(express.json());

//  Servir o HTML principal
app.use(express.static('public'));
//  Servir recursos (CSS, JS, imagens, etc.)
app.use('/src', express.static('src'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/traducao', traducaoRoutes);

app.get('/', (req, res) => res.send('Servidor Tradux ativo!'));

app.listen(process.env.PORT || 3000, () => {
    console.log(`Servidor a correr na porta ${process.env.PORT || "http://localhost:3000/"}`);
});
