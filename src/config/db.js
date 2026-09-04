const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const env = require('./env');
const User = require('../models/User');

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

const logMongoConnectionDiagnostics = () => {
  const variable = process.env.MONGO_URI ? 'MONGO_URI' : 'MONGODB_URI';
  const diagnostics = { variable, username: null, hostname: null, database: null, authSourceDefined: false };

  try {
    const uri = new URL(env.mongoUri);
    diagnostics.username = uri.username ? decodeURIComponent(uri.username) : null;
    diagnostics.hostname = uri.hostname || null;
    diagnostics.database = uri.pathname && uri.pathname !== '/' ? decodeURIComponent(uri.pathname.slice(1)) : null;
    diagnostics.authSourceDefined = uri.searchParams.has('authSource');
  } catch {
    diagnostics.invalidUri = true;
  }

  console.info('MongoDB connection diagnostics', diagnostics);
};

const connectDB = async () => {
  logMongoConnectionDiagnostics();
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
