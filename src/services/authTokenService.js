const crypto = require('crypto');
const { signAccessToken, signRefreshToken } = require('../config/jwt');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const publicUser = (user) => ({
  id: user._id,
  nome: user.nome,
  name: user.nome,
  sobrenome: user.sobrenome,
  telefone: user.telefone,
  phone: user.telefone,
  email: user.email,
  endereco: user.endereco,
  address: user.endereco,
  role: user.role,
});

const issueTokens = async (user) => {
  const payload = { sub: user._id.toString(), role: user.role, email: user.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ sub: user._id.toString() });
  user.refreshToken = hashToken(refreshToken);
  await user.save();
  return { accessToken, refreshToken };
};

module.exports = { hashToken, issueTokens, publicUser };
