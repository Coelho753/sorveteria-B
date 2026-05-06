const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { publicUser } = require('../services/authTokenService');

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
    res.json(publicUser(user));
  } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { nome, firstName, sobrenome, lastName, email, endereco, currentPassword, newPassword, senha } = req.body;
    const user = await User.findById(req.user.sub).select('+senha');
    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    if (nome || firstName) user.nome = nome || firstName;
    if (sobrenome || lastName) user.sobrenome = sobrenome || lastName;
    if (email) user.email = email;
    if (endereco) user.endereco = { ...user.endereco?.toObject?.(), ...endereco };

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
