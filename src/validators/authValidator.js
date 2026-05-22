const validateRegister = (data) => {
  const errors = [];

  // Validar nome (obrigatório, 2–100 caracteres)
  if (!data.name || data.name.trim() === '') {
    errors.push('Nome é obrigatório');
  } else if (data.name.trim().length < 2) {
    errors.push('Nome deve ter pelo menos 2 caracteres');
  } else if (data.name.trim().length > 100) {
    errors.push('Nome não pode exceder 100 caracteres');
  }

  // Validar email (obrigatório, máx. 254 caracteres, formato válido)
  if (!data.email || data.email.trim() === '') {
    errors.push('Email é obrigatório');
  } else if (data.email.trim().length > 254) {
    errors.push('Email não pode exceder 254 caracteres');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      errors.push('Email inválido');
    }
  }

  // Validar password (obrigatória, 6–128 caracteres)
  if (!data.password || data.password.trim() === '') {
    errors.push('Password é obrigatória');
  } else if (data.password.length < 6) {
    errors.push('Password deve ter pelo menos 6 caracteres');
  } else if (data.password.length > 128) {
    errors.push('Password não pode exceder 128 caracteres');
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
