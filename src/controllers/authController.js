const { registerUser, loginUser, renewToken } = require('../services/authService');
const { validateRegister, validateLogin } = require('../validators/authValidator');

const register = async (req, res) => {
  try {
    // Validar dados
    const { isValid, errors } = validateRegister(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await registerUser(req.body);
    return res.status(201).json({ success: true, data: result });

  } catch (error) {
    if (error.message === 'Email já está em uso') {
      return res.status(409).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

const login = async (req, res) => {
  try {
    // Validar dados
    const { isValid, errors } = validateLogin(req.body);
    if (!isValid) {
      return res.status(400).json({ success: false, errors });
    }

    const result = await loginUser(req.body);
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    if (error.message === 'Credenciais inválidas') {
      return res.status(401).json({ success: false, error: error.message });
    }
    if (error.message === 'Utilizador desativado') {
      return res.status(403).json({ success: false, error: error.message });
    }
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

const refresh = async (req, res) => {
  try {
    const result = await renewToken(req.user.id);
    return res.status(200).json({ success: true, data: result });

  } catch (error) {
    return res.status(401).json({ success: false, error: error.message });
  }
};

const me = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: { user: req.user } });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { register, login, refresh, me };