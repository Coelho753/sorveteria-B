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

const app = express();

app.use(helmet());
app.use(cors({
  origin(origin, cb) {
    if (!origin || env.corsAllowlist.includes(origin)) return cb(null, true);
    return cb(new Error('CORS bloqueado'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}));

app.use(express.json({
  limit: '32kb',
  verify: (req, res, buf) => { req.rawBody = buf; },
  type: ['application/json', 'application/*+json'],
}));

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('application/json')) return res.status(415).json({ message: 'Content-Type inválido' });
  next();
});

app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});
app.use(xssClean());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/auth/login', rateLimit({ windowMs: 60 * 1000, max: 5 }));
app.use('/auth/register', rateLimit({ windowMs: 60 * 60 * 1000, max: 3 }));
app.use('/auth/refresh', rateLimit({ windowMs: 60 * 1000, max: 30 }));
app.use('/orders', rateLimit({ windowMs: 60 * 1000, max: 20 }));
app.use(passport.initialize());

app.use('/auth', require('./routes/authRoutes'));
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
