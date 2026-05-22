const express = require('express');
const router = express.Router();
const { addUser, listUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// POST /users — criar utilizador (Administrador)
router.post('/', protect, authorize('Administrador'), addUser);

// GET /users — listar utilizadores (Administrador)
router.get('/', protect, authorize('Administrador'), listUsers);

module.exports = router;
