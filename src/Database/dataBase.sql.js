const { createPool } = require("mysql2");
const { promisify } = require("util");
const dotenv = require("dotenv");



dotenv.config();

const {
  MYSQLHOST,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE,
  MYSQLPORT,
} = require("../keys");

const pool = createPool({
  user: MYSQLUSER,
  password: MYSQLPASSWORD,
  host: MYSQLHOST,
  port: MYSQLPORT,
  database: MYSQLDATABASE,
});

pool.getConnection((err, connection) => {
  if (err) {
    switch (err.code) {
      case "PROTOCOL_CONNECTION_LOST":
        logger.error("❌ Se cerró la conexión a la base de datos");
        break;
      case "ER_CON_COUNT_ERROR":
        logger.error("⚠️ La base de datos tiene demasiadas conexiones");
        break;
      case "ECONNREFUSED":
        logger.error("🚫 La conexión a la base de datos fue rechazada");
        break;
      default:
        logger.error(`🧨 Error inesperado: ${err.message}`);
    }
  }

 
  
});

pool.query = promisify(pool.query);

module.exports = pool;
