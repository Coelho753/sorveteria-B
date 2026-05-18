const mongoose = require('mongoose');

const CATEGORY_ALIASES = {
  tub: 'tub', pote: 'tub', cup: 'cup', copo: 'cup', popsicle: 'popsicle', picole: 'popsicle', picolé: 'popsicle', acai: 'acai', açaí: 'acai',
};

const normalizeCategory = (category) => {
  if (!category) return category;
  const key = category.toString().trim().toLowerCase();
  return CATEGORY_ALIASES[key] || key;
};

const productSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    descricao: { type: String, trim: true, default: '' },
    preco: { type: Number, required: true, min: 0 },
    wholesalePrice: { type: Number, min: 0, default: null },
    imagem: { type: String, trim: true, default: '' },
    categoria: { type: String, required: true, enum: ['tub', 'cup', 'popsicle', 'acai'], trim: true },
    tamanho: { type: String, trim: true, default: '' },
    estoque: { type: Number, min: 0, default: 0 },
    ativo: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.virtual('name').get(function getName() { return this.nome; }).set(function setName(value) { this.nome = value; });
productSchema.virtual('description').get(function getDescription() { return this.descricao; }).set(function setDescription(value) { this.descricao = value; });
productSchema.virtual('price').get(function getPrice() { return this.preco; }).set(function setPrice(value) { this.preco = value; });
productSchema.virtual('wholesale_price').get(function getWholesalePrice() { return this.wholesalePrice; }).set(function setWholesalePrice(value) { this.wholesalePrice = value; });
productSchema.virtual('image').get(function getImage() { return this.imagem; }).set(function setImage(value) { this.imagem = value; });
productSchema.virtual('imageUrl').get(function getImageUrl() { return this.imagem; }).set(function setImageUrl(value) { this.imagem = value; });
productSchema.virtual('category').get(function getCategory() { return this.categoria; }).set(function setCategory(value) { this.categoria = normalizeCategory(value); });
productSchema.virtual('size').get(function getSize() { return this.tamanho; }).set(function setSize(value) { this.tamanho = value; });
productSchema.virtual('stock').get(function getStock() { return this.estoque; }).set(function setStock(value) { this.estoque = value; });
productSchema.virtual('active').get(function getActive() { return this.ativo; }).set(function setActive(value) { this.ativo = value; });

productSchema.pre('validate', function normalizeProduct(next) {
  this.categoria = normalizeCategory(this.categoria);
  next();
});

module.exports = mongoose.model('Product', productSchema);
module.exports.normalizeCategory = normalizeCategory;
