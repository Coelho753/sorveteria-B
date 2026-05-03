const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../config/jwt');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

exports.register = async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email já cadastrado' });
    const hashed = await bcrypt.hash(senha, 12);
    await User.create({ nome, email, senha: hashed });
    res.status(201).json({ message: 'Usuário criado com sucesso' });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email }).select('+refreshToken');
    if (!user || !(await bcrypt.compare(senha, user.senha))) return res.status(401).json({ message: 'Credenciais inválidas' });
    const payload = { sub: user._id, role: user.role, email: user.email };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ sub: user._id });
    user.refreshToken = hashToken(refreshToken);
    await user.save();
    res.json({ accessToken, refreshToken });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub).select('+refreshToken');
    if (!user || user.refreshToken !== hashToken(refreshToken)) return res.status(401).json({ message: 'Refresh token inválido' });
    const accessToken = signAccessToken({ sub: user._id, role: user.role, email: user.email });
    const newRefreshToken = signRefreshToken({ sub: user._id });
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();
    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    await User.findByIdAndUpdate(decoded.sub, { $set: { refreshToken: null } });
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (e) { next(e); }
};
