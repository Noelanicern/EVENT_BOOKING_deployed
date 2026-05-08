const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  port: process.env.PORT,
  dbHost: process.env.DB_HOST,
  dbPort: Number(process.env.DB_PORT),
  dbUser: process.env.DB_USER,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  jwtSecretToken: process.env.JWT_SECRET,
};