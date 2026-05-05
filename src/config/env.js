const dotenv = require('dotenv');
dotenv.config();

const readEnv = (names, fallback = undefined) => {
  for (const name of names) {
    const value = process.env[name];
    if (value !== undefined && value !== '') return value;
  }
  return fallback;
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: readEnv(['PORT'], 3000),
  mongoUri: readEnv(['MONGO_URI', 'MONGODB_URI']),
  jwtAccessSecret: readEnv(['JWT_ACCESS_SECRET', 'JWT_SECRET', 'ACCESS_TOKEN_SECRET', 'JWT_SECRET_KEY', 'SECRET_KEY']),
  jwtRefreshSecret: readEnv(['JWT_REFRESH_SECRET', 'REFRESH_TOKEN_SECRET', 'JWT_REFRESH_TOKEN_SECRET']),
  jwtAccessExpiresIn: readEnv(['JWT_ACCESS_EXPIRES_IN', 'ACCESS_TOKEN_EXPIRES_IN'], '15m'),
  jwtRefreshExpiresIn: readEnv(['JWT_REFRESH_EXPIRES_IN', 'REFRESH_TOKEN_EXPIRES_IN'], '7d'),
  corsOrigin: readEnv(['CORS_ORIGIN'], '*'),
};

const requiredVariables = [
  ['mongoUri', 'MONGO_URI ou MONGODB_URI'],
  ['jwtAccessSecret', 'JWT_ACCESS_SECRET, JWT_SECRET, ACCESS_TOKEN_SECRET, JWT_SECRET_KEY ou SECRET_KEY'],
  ['jwtRefreshSecret', 'JWT_REFRESH_SECRET, REFRESH_TOKEN_SECRET ou JWT_REFRESH_TOKEN_SECRET'],
];

const missingVariables = requiredVariables
  .filter(([key]) => !env[key])
  .map(([, label]) => label);

if (missingVariables.length) {
  throw new Error(`Variáveis de ambiente obrigatórias ausentes: ${missingVariables.join('; ')}`);
}

module.exports = env;
