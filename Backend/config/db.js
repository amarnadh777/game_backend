const mongoose = require('mongoose');
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/myapp';

const connectDB = async () => {

    try {
        await mongoose.connect(dbUrl);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
module.exports = connectDB;
