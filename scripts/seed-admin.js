const bcrypt = require('bcryptjs');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ayla@admin.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD não definido. Defina uma senha forte apenas no ambiente seguro do Render.');
  process.exit(1);
}

const run = async () => {
  await connectDB();

  const senha = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const user = await User.findOneAndUpdate(
    { email: ADMIN_EMAIL.toLowerCase() },
    { $set: { nome: 'Ayla Admin', email: ADMIN_EMAIL.toLowerCase(), senha, role: 'admin' } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  console.log(`Admin pronto: ${user.email}`);
  process.exit(0);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
