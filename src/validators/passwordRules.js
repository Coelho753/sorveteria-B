const strongPasswordMessage = 'Senha deve ter no mínimo 8 caracteres';

const validateStrongPassword = (value) => {
  if (typeof value !== 'string') throw new Error(strongPasswordMessage);
  const isStrong = value.length >= 8 && value.length <= 100;
  if (!isStrong) throw new Error(strongPasswordMessage);
  return true;
};

module.exports = { strongPasswordMessage, validateStrongPassword };
