const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const xssClean = require('xss-clean');
const morgan = require('morgan');
const env = require('./config/env');
const errorMiddleware = require('./middlewares/errorMiddleware');
const inputSanitizer = require('./middlewares/inputSanitizer');

const app = express();

app.use(helmet());
const isAllowedCorsOrigin = (origin) => {
  if (!origin) return true;
  try {
    const { protocol, hostname } = new URL(origin);
    const isHttpLocalhost = protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1');
    const isTrustedHostedApp = protocol === 'https:' && (hostname.endsWith('.onrender.com') || hostname.endsWith('.lovable.app'));
    return env.corsAllowlist.includes(origin) || isHttpLocalhost || isTrustedHostedApp;
  } catch {
    return false;
  }
};

app.use(cors({
  origin(origin, cb) {
    if (isAllowedCorsOrigin(origin)) return cb(null, true);
    return cb(new Error('CORS bloqueado'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-ayla-signature', 'x-webhook-secret'],
  optionsSuccessStatus: 204,
}));
app.use(express.json({ limit: '1mb', verify: (req, res, buf) => { req.rawBody = buf; } }));

app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});
app.use(inputSanitizer);
app.use(xssClean());
morgan.token('origin', (req) => req.headers.origin || '-');
morgan.token('safe-url', (req) => (req.originalUrl || req.url || '').split('?')[0]);
app.use(morgan(':method :safe-url :status :response-time ms origin=:origin'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const mountRoutes = (basePath = '') => {
  app.use(`${basePath}/auth`, require('./routes/authRoutes'));
  app.use(`${basePath}/admin`, require('./routes/adminRoutes'));
  app.use(`${basePath}/users`, require('./routes/userRoutes'));
  app.use(`${basePath}/products`, require('./routes/productRoutes'));
  app.use(`${basePath}/orders`, require('./routes/orderRoutes'));
  app.use(`${basePath}/cart`, require('./routes/cartRoutes'));
  app.use(`${basePath}/finance`, require('./routes/financeRoutes'));
  app.use(`${basePath}/wholesale`, require('./routes/wholesaleRoutes'));
  app.use(`${basePath}/config`, require('./routes/configRoutes'));
};

mountRoutes();
mountRoutes('/api');

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));
app.use(errorMiddleware);

module.exports = app;
