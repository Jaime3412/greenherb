const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
};

const registerUser = async (data) => {
  // Verificar se o email já existe
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw new Error('Email já está em uso');
  }

  // Criar utilizador
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    role: data.role
  });

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
};

const loginUser = async (data) => {
  // Verificar se o utilizador existe
  const user = await User.findOne({ email: data.email });
  if (!user) {
    throw new Error('Credenciais inválidas');
  }

  // Verificar se está ativo
  if (!user.active) {
    throw new Error('Utilizador desativado');
  }

  // Verificar password
  const isPasswordValid = await user.comparePassword(data.password);
  if (!isPasswordValid) {
    throw new Error('Credenciais inválidas');
  }

  const token = generateToken(user);

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    token
  };
};

const renewToken = async (userId) => {
  const user = await User.findById(userId);
  if (!user || !user.active) {
    throw new Error('Utilizador não encontrado ou desativado');
  }

  const token = generateToken(user);
  return { token };
};

module.exports = { generateToken, registerUser, loginUser, renewToken };