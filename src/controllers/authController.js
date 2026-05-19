const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const env = require('../config/env');
const { verifyRefreshToken } = require('../config/jwt');
const { hashToken, issueTokens, publicUser } = require('../services/authTokenService');
const { parseCookies, clearAuthCookies } = require('../middlewares/cookieUtils');

const setAuthCookies = (res, accessToken, refreshToken) => {
  const secure = env.isProd;
  res.append('Set-Cookie', `ayla_at=${accessToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=900${secure ? '; Secure' : ''}`);
  res.append('Set-Cookie', `ayla_rt=${refreshToken}; HttpOnly; SameSite=Strict; Path=/auth/refresh; Max-Age=2592000${secure ? '; Secure' : ''}`);
};

exports.register = async (req, res, next) => {
  try {
    const { nome, sobrenome, email, senha, endereco, role } = req.body;
    if (role !== undefined) return res.status(400).json({ message: 'Campo inválido' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Credenciais inválidas' });

    const hashed = await bcrypt.hash(senha, 12);
    const user = await User.create({ nome, sobrenome, email, senha: hashed, endereco });
    const tokens = await issueTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);

    res.status(201).json({ message: 'Usuário criado com sucesso', user: publicUser(user) });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email }).select('+refreshToken +senha');
    if (!user || !user.senha || !(await bcrypt.compare(senha, user.senha))) return res.status(401).json({ message: 'Credenciais inválidas' });

    const tokens = await issueTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const refreshToken = req.body.refreshToken || cookies.ayla_rt;
    if (!refreshToken) return res.status(401).json({ message: 'Não autenticado' });

    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub).select('+refreshToken');
    if (!user || user.refreshToken !== hashToken(refreshToken)) return res.status(401).json({ message: 'Não autenticado' });

    const tokens = await issueTokens(user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
};

exports.logout = async (req, res, next) => {
  try {
    const cookies = parseCookies(req.headers.cookie);
    const refreshToken = req.body.refreshToken || cookies.ayla_rt;
    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(decoded.sub, { $set: { refreshToken: crypto.randomUUID() } });
    }
    clearAuthCookies(res, env.isProd);
    res.json({ message: 'Logout realizado com sucesso' });
  } catch (e) {
    clearAuthCookies(res, env.isProd);
    next(e);
  }
};

exports.googleCallback = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Falha na autenticação com Google' });
    const tokens = await issueTokens(req.user);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.redirect(req.authRedirect || '/');
  } catch (e) { next(e); }
};
