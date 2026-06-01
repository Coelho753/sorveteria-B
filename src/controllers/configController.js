const env = require('../config/env');

exports.publicConfig = (req, res) => {
  res.json({
    whatsappPhone: env.whatsappPhone,
    whatsapp: env.whatsappPhone,
    address: env.storeAddress,
    hours: env.storeHours,
  });
};
