const express = require('express');
const router = express.Router();
const { addMeasurement } = require('../controllers/measurementController');
const { protect, authorize } = require('../middleware/auth');

// POST /measurements — registar medição (Tecnico, Responsavel)
router.post('/', protect, authorize('Tecnico', 'Responsavel', 'Administrador'), addMeasurement);

module.exports = router;
