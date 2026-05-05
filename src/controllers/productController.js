const Product = require('../models/Product');

exports.create = async (req, res, next) => { try { res.status(201).json(await Product.create(req.body)); } catch (e) { next(e); } };
exports.update = async (req, res, next) => { try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch (e) { next(e); } };
exports.remove = async (req, res, next) => { try { await Product.findByIdAndDelete(req.params.id); res.status(204).send(); } catch (e) { next(e); } };
exports.listAll = async (req, res, next) => { try { res.json(await Product.find()); } catch (e) { next(e); } };
exports.listActive = async (req, res, next) => { try { res.json(await Product.find({ ativo: true })); } catch (e) { next(e); } };
