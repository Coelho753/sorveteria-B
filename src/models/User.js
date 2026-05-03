const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    senha: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    refreshToken: { type: String, default: null, select: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
