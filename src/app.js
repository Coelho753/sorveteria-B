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
app.use(cors({ origin: env.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  req.body = mongoSanitize(req.body);
  req.query = mongoSanitize(req.query);
  req.params = mongoSanitize(req.params);
  next();
});
app.use(xssClean());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
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
