const { generateToken, registerUser, loginUser, renewToken } = require('../../src/services/authService');

// Mock do modelo User
jest.mock('../../src/models/User');
const User = require('../../src/models/User');

// Mock do jsonwebtoken
jest.mock('jsonwebtoken');
const jwt = require('jsonwebtoken');

describe('generateToken', () => {

  test('deve gerar um token JWT válido', () => {
    jwt.sign.mockReturnValue('token_mock');
    const user = { _id: '123', role: 'Tecnico' };
    const token = generateToken(user);
    expect(token).toBe('token_mock');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: '123', role: 'Tecnico' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  });

});

describe('registerUser', () => {

  beforeEach(() => jest.clearAllMocks());

  test('deve registar um utilizador com sucesso', async () => {
    User.findOne.mockResolvedValue(null);
    User.create.mockResolvedValue({
      _id: '123',
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      role: 'Tecnico'
    });
    jwt.sign.mockReturnValue('token_mock');

    const result = await registerUser({
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      password: 'senha123',
      role: 'Tecnico'
    });

    expect(result.user.email).toBe('joao@greenherb.pt');
    expect(result.token).toBe('token_mock');
  });

  test('deve lançar erro se email já está em uso', async () => {
    User.findOne.mockResolvedValue({ email: 'joao@greenherb.pt' });

    await expect(registerUser({
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      password: 'senha123',
      role: 'Tecnico'
    })).rejects.toThrow('Email já está em uso');
  });

});

describe('loginUser', () => {

  beforeEach(() => jest.clearAllMocks());

  test('deve fazer login com sucesso', async () => {
    const mockUser = {
      _id: '123',
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      role: 'Tecnico',
      active: true,
      comparePassword: jest.fn().mockResolvedValue(true)
    };
    User.findOne.mockResolvedValue(mockUser);
    jwt.sign.mockReturnValue('token_mock');

    const result = await loginUser({
      email: 'joao@greenherb.pt',
      password: 'senha123'
    });

    expect(result.user.email).toBe('joao@greenherb.pt');
    expect(result.token).toBe('token_mock');
  });

  test('deve lançar erro se utilizador não existe', async () => {
    User.findOne.mockResolvedValue(null);

    await expect(loginUser({
      email: 'naoexiste@greenherb.pt',
      password: 'senha123'
    })).rejects.toThrow('Credenciais inválidas');
  });

  test('deve lançar erro se utilizador está desativado', async () => {
    User.findOne.mockResolvedValue({
      active: false,
      comparePassword: jest.fn()
    });

    await expect(loginUser({
      email: 'joao@greenherb.pt',
      password: 'senha123'
    })).rejects.toThrow('Utilizador desativado');
  });

  test('deve lançar erro se password está errada', async () => {
    User.findOne.mockResolvedValue({
      active: true,
      comparePassword: jest.fn().mockResolvedValue(false)
    });

    await expect(loginUser({
      email: 'joao@greenherb.pt',
      password: 'senha_errada'
    })).rejects.toThrow('Credenciais inválidas');
  });

});

describe('renewToken', () => {

  beforeEach(() => jest.clearAllMocks());

  test('deve renovar token com sucesso', async () => {
    User.findById.mockResolvedValue({
      _id: '123',
      name: 'João Silva',
      email: 'joao@greenherb.pt',
      role: 'Tecnico',
      active: true
    });
    jwt.sign.mockReturnValue('novo_token_mock');

    const result = await renewToken('123');
    expect(result.token).toBe('novo_token_mock');
  });

  test('deve lançar erro se utilizador não existe', async () => {
    User.findById.mockResolvedValue(null);

    await expect(renewToken('123')).rejects.toThrow('Utilizador não encontrado ou desativado');
  });

  test('deve lançar erro se utilizador está desativado', async () => {
    User.findById.mockResolvedValue({ active: false });

    await expect(renewToken('123')).rejects.toThrow('Utilizador não encontrado ou desativado');
  });

});