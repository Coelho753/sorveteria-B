const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 1 },
    preco: { type: Number, required: true, min: 0 },
    imagem: { type: String, default: '' },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
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

const orderSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itens: { type: [itemSchema], required: true },
  valorTotal: { type: Number, required: true, min: 0 },
  endereco: { type: addressSchema, default: () => ({}) },
  status: { type: String, enum: ['pendente', 'concluido'], default: 'pendente' },
  data: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
