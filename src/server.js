const app = require('./app');
const connectDB = require('./config');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Servidor a correr na porta ${PORT}`);
  });
};

start();
