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
app.use(express.static('public'));
app.use('/src', express.static('src'));


app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/traducao', traducaoRoutes);

app.get('/', (req, res) => res.send('Servidor Tradux ativo!'));

app.listen(process.env.PORT || 5000, () => {
    console.log(`Servidor a correr na porta http://localhost:${process.env.PORT}/`);
});
console.log('SERVICE KEY:', process.env.SUPABASE_SERVICE_KEY ? 'OK' : 'MISSING');
