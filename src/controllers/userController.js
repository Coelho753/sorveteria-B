const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Order = require('../models/Order');
const { publicUser } = require('../services/authTokenService');
const AdminAudit = require('../models/AdminAudit');

const mergeAddress = (currentAddress, nextAddress) => ({
  ...currentAddress?.toObject?.(),
  ...nextAddress,
});

const getAuthenticatedUserId = (req) => req.user.sub || req.user.id;

const applyProfileFields = (user, body, allowAdminFields = false) => {
  const { nome, name, firstName, sobrenome, lastName, email, telefone, phone, endereco, address } = body;

  if (nome || name || firstName) user.nome = nome || name || firstName;
  if (sobrenome || lastName) user.sobrenome = sobrenome || lastName;
  if (allowAdminFields && email) user.email = email.toLowerCase();
  if (telefone || phone) user.telefone = telefone || phone;
  if (endereco || address) user.endereco = mergeAddress(user.endereco, endereco || address);

  if (allowAdminFields && body.role) user.role = body.role;
};

const assertEmailIsAvailable = async (email, currentUserId) => {
  if (!email) return;
  const existingUser = await User.findOne({ email: email.toLowerCase(), _id: { $ne: currentUserId } });
  if (existingUser) {
    const error = new Error('Email já está em uso');
    error.statusCode = 409;
    error.expose = true;
    throw error;
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(publicUser(user));
  } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    if (req.body.role !== undefined) return res.status(400).json({ message: 'Campo inválido' });
    const { currentPassword, newPassword, senha } = req.body;
    const user = await User.findById(req.user.sub).select('+senha');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    applyProfileFields(user, req.body);

    const passwordToSet = newPassword || senha;
    if (passwordToSet) {
      if (user.senha) {
        if (!currentPassword) return res.status(400).json({ message: 'Senha atual obrigatória para alterar a senha' });
        const passwordMatches = await bcrypt.compare(currentPassword, user.senha);
        if (!passwordMatches) return res.status(401).json({ message: 'Senha atual inválida' });
      }
      user.senha = await bcrypt.hash(passwordToSet, 12);
    }

    await user.save();
    res.json(publicUser(user));
  } catch (e) { next(e); }
};

exports.listUsers = async (req, res, next) => {
  try {
    const search = req.query.search?.trim();
    const filter = search
      ? { $or: [{ nome: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { telefone: new RegExp(search, 'i') }] }
      : {};
    res.json(await User.find(filter).sort({ createdAt: -1 }).select('-senha -refreshToken'));
  } catch (e) { next(e); }
};

exports.updateUser = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const isSelf = String(getAuthenticatedUserId(req)) === String(req.params.id);
    if (!isAdmin && !isSelf) return res.status(403).json({ message: 'Acesso negado' });

    if (!isAdmin && (req.body.email !== undefined || req.body.role !== undefined)) {
      return res.status(400).json({ message: 'Campo inválido' });
    }

    const user = await User.findById(req.params.id).select('+senha');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (isAdmin) await assertEmailIsAvailable(req.body.email, user._id);
    applyProfileFields(user, req.body, isAdmin);

    const passwordToSet = req.body.password ?? req.body.senha;
    if (passwordToSet) user.senha = await bcrypt.hash(passwordToSet, 12);

    await user.save();

    if (isAdmin) {
      await AdminAudit.create({
        user_id: getAuthenticatedUserId(req),
        action: 'admin.user.update',
        payload: { targetUserId: req.params.id, fields: Object.keys(req.body).filter((field) => field !== 'password' && field !== 'senha') },
        ip: req.ip || '',
        ua: req.headers['user-agent'] || '',
      });
    }

    res.json(publicUser(user));
  } catch (e) { next(e); }
};

exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    await Order.updateMany({ usuario: req.params.id }, { $unset: { usuario: 1 } });

    await AdminAudit.create({
      user_id: req.user.sub,
      action: 'admin.user.delete',
      payload: { targetUserId: req.params.id },
      ip: req.ip || '',
      ua: req.headers['user-agent'] || '',
    });

    res.json({ ok: true });
  } catch (e) { next(e); }
};


exports.patchRole = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    user.role = req.body.role;
    await user.save();

    await AdminAudit.create({
      user_id: req.user.sub,
      action: 'admin.user.role.patch',
      payload: { targetUserId: req.params.id, role: req.body.role },
      ip: req.ip || '',
      ua: req.headers['user-agent'] || '',
    });

    res.json(publicUser(user));
  } catch (e) { next(e); }
};
