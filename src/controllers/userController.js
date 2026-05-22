const { createUser, getUsers } = require('../services/userService');
const { validateRegister } = require('../validators/authValidator');
const { log } = require('../services/auditService');

const addUser = async (req, res) => {
  try {
    const { isValid, errors } = validateRegister(req.body);
    if (!isValid) return res.status(400).json({ success: false, errors });

    const user = await createUser(req.body);
    await log(req.user.id, 'CREATE_USER', 'users', user.id);
    return res.status(201).json({ success: true, data: user });

  } catch (error) {
    if (error.code === 'CONFLICT') return res.status(409).json({ success: false, error: error.message });
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

const listUsers = async (req, res) => {
  try {
    const users = await getUsers();
    return res.status(200).json({ success: true, data: users });
  } catch {
    return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

module.exports = { addUser, listUsers };
