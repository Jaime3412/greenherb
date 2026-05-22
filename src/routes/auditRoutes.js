const express = require('express');
const router = express.Router();
const { listAudit } = require('../controllers/auditController');
const { protect, authorize } = require('../middleware/auth');

// GET /audit — consultar log de auditoria (Administrador)
router.get('/', protect, authorize('Administrador'), listAudit);

module.exports = router;
