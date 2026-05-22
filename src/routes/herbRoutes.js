const express = require('express');
const router = express.Router();
const multer = require('multer');
const { importHerbs } = require('../controllers/herbController');
const { protect, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage() });

// POST /herbs/import — Importação de ervas a partir de ficheiro CSV (Administrador)
router.post('/import', protect, authorize('Administrador'), upload.single('file'), importHerbs);

module.exports = router;
