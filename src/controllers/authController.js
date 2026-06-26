const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyRefreshToken } = require('../config/jwt');
const { hashToken, issueTokens, publicUser } = require('../services/authTokenService');

exports.register = async (req, res, next) => {
  try {
    const { nome, name, sobrenome, email, senha, password, endereco, address, telefone, phone, role } = req.body;
    if (role !== undefined) return res.status(400).json({ message: 'Campo inválido' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Credenciais inválidas' });

    const hashed = await bcrypt.hash(senha || password, 12);
    const user = await User.create({ nome: nome || name, sobrenome, email, senha: hashed, endereco: endereco || address, telefone: telefone || phone });
    const tokens = await issueTokens(user);

    res.status(201).json({ message: 'Usuário criado com sucesso', user: publicUser(user), ...tokens });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha, password } = req.body;
    const user = await User.findOne({ email }).select('+refreshToken +senha');
    if (!user || !user.senha || !(await bcrypt.compare(senha || password, user.senha))) return res.status(401).json({ message: 'Credenciais inválidas' });

    const tokens = await issueTokens(user);
    res.json({ user: publicUser(user), ...tokens });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub).select('+refreshToken');
    if (!user || user.refreshToken !== hashToken(refreshToken)) return res.status(401).json({ message: 'Não autenticado' });

    const tokens = await issueTokens(user);
    res.json({ ...tokens });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(decoded.sub, { $set: { refreshToken: null } });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id || req.user.sub);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
};
