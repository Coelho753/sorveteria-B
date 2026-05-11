const mongoose = require('mongoose');

const enderecoSchema = new mongoose.Schema(
  {
    cep: { type: String, trim: true, default: '' },
    rua: { type: String, trim: true, default: '' },
    numero: { type: String, trim: true, default: '' },
    complemento: { type: String, trim: true, default: '' },
    bairro: { type: String, trim: true, default: '' },
    cidade: { type: String, trim: true, default: '' },
    estado: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    sobrenome: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senha: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true, default: undefined },
    endereco: { type: enderecoSchema, default: () => ({}) },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
