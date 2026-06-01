const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    produtoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    nome: { type: String, required: true },
    quantidade: { type: Number, required: true, min: 1 },
    preco: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, min: 0, default: 0 },
    wholesaleApplied: { type: Boolean, default: false },
    imagem: { type: String, default: '' },
    categoria: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    cep: { type: String, trim: true, default: '' }, rua: { type: String, trim: true, default: '' }, numero: { type: String, trim: true, default: '' }, complemento: { type: String, trim: true, default: '' }, bairro: { type: String, trim: true, default: '' }, cidade: { type: String, trim: true, default: '' }, estado: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, trim: true, default: '' },
    customerPhone: { type: String, trim: true, default: '' },
    source: { type: String, enum: ['site', 'whatsapp', 'admin'], default: 'site' },
    itens: { type: [itemSchema], required: true },
    valorTotal: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, min: 0, default: 0 },
    wholesaleDiscount: { type: Number, min: 0, default: 0 },
    endereco: { type: addressSchema, default: () => ({}) },
    status: { type: String, enum: ['novo', 'pendente', 'preparando', 'enviado', 'saiu_entrega', 'entregue', 'cancelado', 'concluido'], default: 'novo' },
    data: { type: Date, default: Date.now },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.virtual('userId').get(function getUserId() { return this.usuario; });
orderSchema.virtual('items').get(function getItems() {
  return this.itens.map((item) => ({
    id: item.produtoId, productId: item.produtoId, name: item.nome, quantity: item.quantidade, price: item.preco, originalPrice: item.originalPrice, wholesaleApplied: item.wholesaleApplied, image: item.imagem, category: item.categoria,
  }));
});
orderSchema.virtual('total').get(function getTotal() { return this.valorTotal; });
orderSchema.virtual('address').get(function getAddress() { return this.endereco; });
orderSchema.virtual('createdAtAlias').get(function getCreatedAtAlias() { return this.data; });

module.exports = mongoose.model('Order', orderSchema);
