const express = require('express');
const router = express.Router();
const { register, login, refresh, me } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /auth/register — Registo de utilizador
router.post('/register', register);

// POST /auth/login — Login
router.post('/login', login);

// POST /auth/refresh — Renovar token (requer autenticação)
router.post('/refresh', protect, refresh);

// GET /auth/me — Obter utilizador autenticado (requer autenticação)
router.get('/me', protect, me);

module.exports = router;