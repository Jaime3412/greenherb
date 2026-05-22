const User = require('../models/User');

const createUser = async (data) => {
  const exists = await User.findOne({ email: data.email });
  if (exists) {
    const err = new Error('Email já está em uso');
    err.code = 'CONFLICT';
    throw err;
  }
  const user = await User.create(data);
  return { id: user._id, name: user.name, email: user.email, role: user.role };
};

const getUsers = async () => User.find({}, '-password');

module.exports = { createUser, getUsers };
