const env = require('../config/env');

exports.publicConfig = (req, res) => {
  res.json({
    whatsapp: env.whatsappPhone,
    address: env.storeAddress,
    hours: env.storeHours,
  });
};
