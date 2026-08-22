const { body, param } = require('express-validator');
const { CAROUSEL_KEYS } = require('../models/Carousel');

exports.replaceCarouselValidator = [
  param('key').isIn(CAROUSEL_KEYS),
  body('items').isArray(),
  body('items.*.id').isString().trim().notEmpty(),
  body('items.*.name').isString().trim().notEmpty(),
  body('items.*.price').isFloat({ min: 0 }),
  body('items.*.img').optional().isString().trim(),
  body('items.*.desc').optional().isString().trim(),
];

exports.carouselKeyValidator = [
  param('key').isIn(CAROUSEL_KEYS),
];
