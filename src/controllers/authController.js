const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyRefreshToken } = require('../config/jwt');
const { hashToken, issueTokens, publicUser } = require('../services/authTokenService');

exports.register = async (req, res, next) => {
  try {
    const { nome, sobrenome, email, senha, endereco } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(senha, 12);
    const user = await User.create({ nome, sobrenome, email, senha: hashed, endereco });
    const tokens = await issueTokens(user);

    res.status(201).json({ message: 'Usuário criado com sucesso', user: publicUser(user), ...tokens });
  } catch (e) { next(e); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email }).select('+refreshToken +senha');
    if (!user || !user.senha || !(await bcrypt.compare(senha, user.senha))) return res.status(401).json({ message: 'Credenciais inválidas' });

    const tokens = await issueTokens(user);
    res.json({ user: publicUser(user), ...tokens });
  } catch (e) { next(e); }
};

exports.refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.sub).select('+refreshToken');
    if (!user || user.refreshToken !== hashToken(refreshToken)) return res.status(401).json({ message: 'Refresh token inválido' });

    const tokens = await issueTokens(user);
    res.json({ user: publicUser(user), ...tokens });
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

const appendTokensToRedirect = (redirectUrl, accessToken, refreshToken) => {
  const fallbackUrl = '/';
  const target = redirectUrl || fallbackUrl;
  const base = target.startsWith('http://') || target.startsWith('https://') ? undefined : 'http://localhost';
  const url = new URL(target, base);
  url.searchParams.set('token', accessToken);
  url.searchParams.set('refresh', refreshToken);

  if (base) return `${url.pathname}${url.search}${url.hash}`;
  return url.toString();
};

exports.googleCallback = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Falha na autenticação com Google' });

    const tokens = await issueTokens(req.user);
    const redirectUrl = appendTokensToRedirect(req.authRedirect, tokens.accessToken, tokens.refreshToken);
    res.redirect(redirectUrl);
  } catch (e) { next(e); }
};
