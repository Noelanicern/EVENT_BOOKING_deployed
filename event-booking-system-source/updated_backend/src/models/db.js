const mysql = require("mysql2/promise");
const env = require("../config/env");

const pool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("MySQL connection failed:", err.message);
    return;
  }

  console.log("Connected to MySQL database:", env.dbName);
  connection.release();
});

module.exports = pool;