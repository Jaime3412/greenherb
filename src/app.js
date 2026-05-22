const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
const authRoutes        = require('./routes/authRoutes');
const herbRoutes        = require('./routes/herbRoutes');
const userRoutes        = require('./routes/userRoutes');
const planRoutes        = require('./routes/planRoutes');
const batchRoutes       = require('./routes/batchRoutes');
const measurementRoutes = require('./routes/measurementRoutes');
const alertRoutes       = require('./routes/alertRoutes');
const auditRoutes       = require('./routes/auditRoutes');

app.use('/auth',         authRoutes);
app.use('/herbs',        herbRoutes);
app.use('/users',        userRoutes);
app.use('/plans',        planRoutes);
app.use('/batches',      batchRoutes);
app.use('/measurements', measurementRoutes);
app.use('/alerts',       alertRoutes);
app.use('/audit',        auditRoutes);

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: '🌿 GREENHERB API está a funcionar!' });
});

// Rota não encontrada
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Rota não encontrada' });
});

module.exports = app;