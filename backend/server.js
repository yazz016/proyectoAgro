require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./src/config/database');

const authRoutes = require('./src/routes/authRoutes');
const cultivoRoutes = require('./src/routes/cultivoRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500']
}));
app.use(express.json());

// Conectar a la base de datos
conectarDB();

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cultivos', cultivoRoutes);

app.get('/', (req, res) => {
    res.json({ mensaje: '🚀 AgroXpress API funcionando' });
});

// Manejo de errores
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.message);
    res.status(err.status || 500).json({
        mensaje: err.message || 'Error interno del servidor'
    });
});

app.listen(PORT, () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
});

