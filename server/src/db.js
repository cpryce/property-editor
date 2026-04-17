const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/property-editor';

async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected to', MONGO_URI);
}

module.exports = connectDB;
module.exports.mongoose = mongoose; // exposed for testing
