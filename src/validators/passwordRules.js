const strongPasswordMessage = 'Senha deve ter no mínimo 10 caracteres, incluindo maiúscula, minúscula, número e símbolo';

const hasSymbol = (value) => /[^A-Za-z0-9]/.test(value);

const validateStrongPassword = (value) => {
  if (typeof value !== 'string') throw new Error(strongPasswordMessage);
  const isStrong = value.length >= 10
    && value.length <= 100
    && /[A-Z]/.test(value)
    && /[a-z]/.test(value)
    && /[0-9]/.test(value)
    && hasSymbol(value);
  if (!isStrong) throw new Error(strongPasswordMessage);
  return true;
};

module.exports = { strongPasswordMessage, validateStrongPassword };
