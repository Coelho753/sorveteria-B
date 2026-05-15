const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { publicUser } = require('../services/authTokenService');

const mergeAddress = (currentAddress, nextAddress) => ({
  ...currentAddress?.toObject?.(),
  ...nextAddress,
});

const applyProfileFields = (user, body, allowAdminFields = false) => {
  const { nome, name, firstName, sobrenome, lastName, email, telefone, phone, endereco, address } = body;

  if (nome || name || firstName) user.nome = nome || name || firstName;
  if (sobrenome || lastName) user.sobrenome = sobrenome || lastName;
  if (email) user.email = email;
  if (telefone || phone) user.telefone = telefone || phone;
  if (endereco || address) user.endereco = mergeAddress(user.endereco, endereco || address);

  if (allowAdminFields) {
    if (body.role) user.role = body.role;
    if (body.loyaltyStamps !== undefined) user.loyaltyStamps = body.loyaltyStamps;
    if (body.loyaltyCredits !== undefined) user.loyaltyCredits = body.loyaltyCredits;
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
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    applyProfileFields(user, req.body, true);
    await user.save();

    res.json(publicUser(user));
  } catch (e) { next(e); }
};
