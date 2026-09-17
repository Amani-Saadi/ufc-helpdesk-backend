import app from './app.js';
import dotenv from 'dotenv';

dotenv.config();

// Fix for Prisma BigInt serialization in JSON responses
BigInt.prototype.toJSON = function() {
    return this.toString();
};

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});