const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // The database remains authoritative so tokens issued before the role claim
    // was added do not prevent an existing admin from using the panel.
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'admin') return res.status(403).json({ message: 'Acesso negado' });
    req.user.role = user.role;
    next();
  } catch (error) {
    next(error);
  }
};
