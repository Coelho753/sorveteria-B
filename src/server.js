const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

(async () => {
  await connectDB();
  app.listen(env.port, () => console.log(`Servidor rodando na porta ${env.port}`));
})();
