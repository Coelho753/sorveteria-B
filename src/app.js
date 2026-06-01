const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('mongo-sanitize');
const xssClean = require('xss-clean');
const morgan = require('morgan');
const passport = require('./config/passport');
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
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
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
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(passport.initialize());

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', require('./routes/authRoutes'));
app.use('/admin', require('./routes/adminRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/products', require('./routes/productRoutes'));
app.use('/orders', require('./routes/orderRoutes'));
app.use('/cart', require('./routes/cartRoutes'));
app.use('/finance', require('./routes/financeRoutes'));
app.use('/wholesale', require('./routes/wholesaleRoutes'));
app.use('/config', require('./routes/configRoutes'));

app.use((req, res) => res.status(404).json({ message: 'Rota não encontrada' }));
app.use(errorMiddleware);

module.exports = app;
