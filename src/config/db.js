const mongoose = require('mongoose');
const env = require('./env');

mongoose.set('sanitizeFilter', true);
mongoose.set('strictQuery', true);

const connectDB = async () => {
  await mongoose.connect(env.mongoUri);
  console.log('MongoDB conectado');
};

module.exports = connectDB;
