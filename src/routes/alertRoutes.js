const express = require('express');
const router = express.Router();
const { listAlerts, patchAlert } = require('../controllers/alertController');
const { protect, authorize } = require('../middleware/auth');

// GET /alerts — listar alertas (todos os autenticados)
router.get('/', protect, listAlerts);

// PATCH /alerts/:id — resolver ou ignorar alerta (Responsavel, Administrador)
router.patch('/:id', protect, authorize('Responsavel', 'Administrador'), patchAlert);

module.exports = router;
