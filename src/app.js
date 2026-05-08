const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
const authRoutes = require('./routes/authRoutes');
app.use('/auth', authRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: '🌿 GREENHERB API está a funcionar!' });
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

module.exports = app;