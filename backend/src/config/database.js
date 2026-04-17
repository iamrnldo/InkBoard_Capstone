// backend/src/config/database.js
const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  // ✅ WAJIB untuk Koyeb PostgreSQL
  ssl: process.env.NODE_ENV === "production"
    ? { rejectUnauthorized: false }
    : false,
});

pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ PostgreSQL pool error:", err);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === "development") {
      console.log("Query executed:", {
        text: text.substring(0, 50),
        duration,
        rows: res.rowCount,
      });
    }
    return res;
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };

// const { Pool } = require("pg");
// require("dotenv").config();

// const pool = new Pool({
//   host: process.env.DB_HOST || "localhost",
//   port: process.env.DB_PORT || 5432,
//   database: process.env.DB_NAME || "inkboard",
//   user: process.env.DB_USER || "postgres",
//   password: process.env.DB_PASSWORD,
//   max: 20,
//   idleTimeoutMillis: 30000,
//   connectionTimeoutMillis: 2000,
// });

// pool.on("connect", () => {
//   console.log("✅ Connected to PostgreSQL database");
// });

// pool.on("error", (err) => {
//   console.error("❌ PostgreSQL pool error:", err);
// });

// const query = async (text, params) => {
//   const start = Date.now();
//   try {
//     const res = await pool.query(text, params);
//     const duration = Date.now() - start;
//     if (process.env.NODE_ENV === "development") {
//       console.log("Query executed:", {
//         text: text.substring(0, 50),
//         duration,
//         rows: res.rowCount,
//       });
//     }
//     return res;
//   } catch (error) {
//     console.error("Database query error:", error);
//     throw error;
//   }
// };

// const getClient = () => pool.connect();

// module.exports = { query, getClient, pool };

