// ==================== IMPORTACIÓN DE DEPENDENCIAS ====================
const { Sequelize, DataTypes } = require("sequelize");
const {
  MYSQLHOST,
  MYSQLUSER,
  MYSQLPASSWORD,
  MYSQLDATABASE,
  MYSQLPORT,
  MYSQL_URI
} = require("../keys");

// ==================== INICIALIZACIÓN DE CONEXIÓN ====================
let sequelize;

// Si existe una URI completa en .env, se usa directamente
if (MYSQL_URI) {
  sequelize = new Sequelize(MYSQL_URI, {
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4', // Soporte para emojis y caracteres especiales
    },
    pool: {
      max: 20, // Máximo de conexiones abiertas
      min: 5,  // Mínimo de conexiones mantenidas
      acquire: 30000, // Tiempo máximo para adquirir una conexión (ms)
      idle: 10000 // Tiempo máximo que puede estar inactiva (ms)
    },
    logging: false // Desactiva logs de SQL para mejorar rendimiento
  });
} else {
  // Configuración estándar por variables individuales
  sequelize = new Sequelize(MYSQLDATABASE, MYSQLUSER, MYSQLPASSWORD, {
    host: MYSQLHOST,
    port: MYSQLPORT,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
    },
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    logging: false
  });
}

// ==================== VERIFICAR CONEXIÓN A LA BASE DE DATOS ====================
sequelize.authenticate()
  .then(() => {
    console.log("✅ Conexión establecida con la base de datos");
  })
  .catch((err) => {
    console.error("❌ No se pudo conectar a la base de datos:", err.message);
  });

// ==================== IMPORTACIÓN DE MODELOS ====================
const usuarioModel = require('../models/sql/usuario');
const rolModel = require('../models/sql/rol');
const usuarioRolModel = require('../models/sql/usuarioRol');

// ==================== INSTANCIACIÓN DE MODELOS ====================
const Usuario = usuarioModel(sequelize, DataTypes);
const Rol = rolModel(sequelize, DataTypes);
const UsuarioRol = usuarioRolModel(sequelize, DataTypes);

// ==================== DEFINICIÓN DE RELACIONES ====================
// Un usuario puede tener muchos roles, y un rol puede pertenecer a muchos usuarios
Usuario.belongsToMany(Rol, { through: UsuarioRol, foreignKey: 'idUsuario' });
Rol.belongsToMany(Usuario, { through: UsuarioRol, foreignKey: 'idRol' });

// ==================== SINCRONIZACIÓN DE BASE DE DATOS ====================
// En desarrollo, usamos force para recrear; en producción, alter para ajustar
const syncOptions = process.env.NODE_ENV === 'development' ? { force: true } : { alter: true };

// Sincronizar modelos y crear roles por defecto si no existen
sequelize.sync(syncOptions)
  .then(async () => {
    console.log('✅ Base de datos sincronizada');

    // Crear roles predeterminados si no existen
    const rolesIniciales = ['admin', 'mesero', 'cliente'];

    for (const nombre of rolesIniciales) {
      const existe = await Rol.findOne({ where: { nombreRol: nombre } });
      if (!existe) {
        await Rol.create({ nombreRol: nombre });
        console.log(`🔄 Rol creado: ${nombre}`);
      }
    }

  })
  .catch((error) => {
    console.error('❌ Error al sincronizar la base de datos:', error);
  });

// ==================== EXPORTAR MODELOS Y CONEXIÓN ====================
module.exports = {
  sequelize,
  Usuario,
  Rol,
  UsuarioRol
};
