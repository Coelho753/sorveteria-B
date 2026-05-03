const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.sub).select('-senha');
    res.json(user);
  } catch (e) { next(e); }
};

exports.updateMe = async (req, res, next) => {
  try {
    const { nome, email, senha } = req.body;
    const update = {};
    if (nome) update.nome = nome;
    if (email) update.email = email;
    if (senha) update.senha = await bcrypt.hash(senha, 12);
    const user = await User.findByIdAndUpdate(req.user.sub, update, { new: true }).select('-senha');
    res.json(user);
  } catch (e) { next(e); }
};
