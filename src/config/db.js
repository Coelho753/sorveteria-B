const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('./env');
const User = require('../models/User');

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

const connectDB = async () => {
  await mongoose.connect(env.mongoUri);
  const usersCount = await User.estimatedDocumentCount();
  if (usersCount === 0 && env.adminBootstrapEmail && env.adminBootstrapPassword) {
    const senha = await bcrypt.hash(env.adminBootstrapPassword, 12);
    await User.create({ nome: 'Admin', email: env.adminBootstrapEmail.toLowerCase(), senha, role: 'admin' });
    console.log('Admin bootstrap criado');
  }
  console.log('MongoDB conectado');
};

module.exports = connectDB;
