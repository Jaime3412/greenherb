const validateRegister = (data) => {
  const errors = [];

  // Validar nome
  if (!data.name || data.name.trim() === '') {
    errors.push('Nome é obrigatório');
  }

  // Validar email
  if (!data.email || data.email.trim() === '') {
    errors.push('Email é obrigatório');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Email inválido');
    }
  }

  // Validar password
  if (!data.password || data.password.trim() === '') {
    errors.push('Password é obrigatória');
  } else if (data.password.length < 6) {
    errors.push('Password deve ter pelo menos 6 caracteres');
  }

  // Validar perfil
  const validRoles = ['Tecnico', 'Responsavel', 'Administrador'];
  if (!data.role || data.role.trim() === '') {
    errors.push('Perfil é obrigatório');
  } else if (!validRoles.includes(data.role)) {
    errors.push(`Perfil inválido. Valores aceites: ${validRoles.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

const validateLogin = (data) => {
  const errors = [];

  // Validar email
  if (!data.email || data.email.trim() === '') {
    errors.push('Email é obrigatório');
  }

  // Validar password
  if (!data.password || data.password.trim() === '') {
    errors.push('Password é obrigatória');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = { validateRegister, validateLogin };