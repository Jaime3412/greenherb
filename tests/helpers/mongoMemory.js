const mongoose = require('mongoose');

const TEST_URI = 'mongodb://127.0.0.1:27017/greenherb_test';

const connect = async () => {
  await mongoose.connect(TEST_URI);
};

const disconnect = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
};

const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, disconnect, clearDatabase };