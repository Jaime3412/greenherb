const express = require('express');
const router = express.Router();
const { addBatch, getBatch, updateBatch } = require('../controllers/batchController');
const { protect, authorize } = require('../middleware/auth');

// POST /batches — criar lote (Tecnico, Responsavel)
router.post('/', protect, authorize('Tecnico', 'Responsavel', 'Administrador'), addBatch);

// GET /batches/:id — obter lote
router.get('/:id', protect, getBatch);

// PATCH /batches/:id — fechar lote (Responsavel, Administrador)
router.patch('/:id', protect, authorize('Responsavel', 'Administrador'), updateBatch);

module.exports = router;
