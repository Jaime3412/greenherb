const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const protect = async (req, res, next) => {
  try {
    // Verificar se o token existe
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Acesso negado. Token não fornecido' });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar se o utilizador ainda existe
    const user = await User.findById(decoded.id);
    if (!user || !user.active) {
      return res.status(401).json({ success: false, error: 'Token inválido' });
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();

  } catch (error) {
    return res.status(401).json({ success: false, error: 'Token inválido ou expirado' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Perfil '${req.user.role}' não tem permissão para aceder a este recurso`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };