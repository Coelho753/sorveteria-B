const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, required: true, trim: true },
    preco: { type: Number, required: true, min: 0 },
    imagem: { type: String, required: true },
    categoria: { type: String, required: true, trim: true },
    estoque: { type: Number, required: true, min: 0 },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
