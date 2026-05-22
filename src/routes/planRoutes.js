const express = require('express');
const router = express.Router();
const { addPlan, listPlans } = require('../controllers/planController');
const { protect, authorize } = require('../middleware/auth');

// POST /plans — criar plano (Responsavel ou Administrador)
router.post('/', protect, authorize('Responsavel', 'Administrador'), addPlan);

// GET /plans — listar planos (todos os perfis autenticados)
router.get('/', protect, listPlans);

module.exports = router;
