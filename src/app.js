// Importar módulos necesarios
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const MySQLStore = require('express-mysql-session')(session);
const fileUpload = require("express-fileupload");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const winston = require('winston');
const fs = require('fs');
const crypto = require('crypto');
const hpp = require('hpp');
const toobusy = require('toobusy-js');
const cors = require('cors');

const authRoutes = require('./router/auth.routes');            // Rutas de autenticación
const rolesRoutes = require('./router/roles.routes');          // Rutas para gestión de roles

require('./Database/dataBase.orm');       // Configuración y sincronización de modelos Sequelize
require('./Database/dataBaseMongose');    // Configuración para MongoDB (si se usa)
require('./Database/dataBase.sql');       // Conexión básica con MySQL (mysql2)

// Importar configuración de conexión
const { MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT } = require('./keys');

// Crear aplicación Express
const app = express();

// ==================== CONFIGURACIÓN BÁSICA ====================
app.set('port', process.env.PORT || 4500);

// Habilitar CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true
}));

// ==================== CONFIGURACIÓN DE LOGS MEJORADA ====================
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

const logIcons = {
  info: '🔵', warn: '⚠️', error: '❌', debug: '🔍', success: '✅',
  database: '🗄️', server: '🚀', security: '🔐', api: '🌐'
};

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(info => {
      const icon = logIcons[info.level] || logIcons.info;
      return `${info.timestamp} ${icon} [${info.level.toUpperCase()}]: ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
      tailable: true
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.printf(info => {
          const icon = logIcons[info.level] || logIcons.info;
          return `${info.timestamp} ${icon} [${info.level.toUpperCase()}]: ${info.message}`;
        })
      )
    })
  ]
});

logger.success = msg => logger.info(`${logIcons.success} ${msg}`);
logger.database = msg => logger.info(`${logIcons.database} ${msg}`);
logger.server = msg => logger.info(`${logIcons.server} ${msg}`);
logger.security = msg => logger.warn(`${logIcons.security} ${msg}`);
logger.api = msg => logger.info(`${logIcons.api} ${msg}`);

console.log = (...args) => logger.info(args.join(' '));
console.info = (...args) => logger.info(args.join(' '));
console.warn = (...args) => logger.warn(args.join(' '));
console.error = (...args) => logger.error(args.join(' '));
console.debug = (...args) => logger.debug(args.join(' '));

// ==================== SEGURIDAD Y CONTROL ====================
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
  stream: { write: msg => logger.info(msg.replace(/\n$/, '')) }
}));

app.use((req, res, next) => {
  if (toobusy()) {
    logger.security('Server too busy!');
    res.status(503).json({ error: 'Server too busy. Please try again later.' });
  } else {
    next();
  }
});

app.use(helmet());
app.use(hpp());
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    logger.security(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});
app.use(limiter);

app.use(cookieParser(process.env.COOKIE_SECRET || crypto.randomBytes(64).toString('hex'), {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 24 * 60 * 60 * 1000
}));

const sessionConfig = {
  store: new MySQLStore({
    host: MYSQLHOST,
    port: MYSQLPORT,
    user: MYSQLUSER,
    password: MYSQLPASSWORD,
    database: MYSQLDATABASE,
    createDatabaseTable: true
  }),
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000
  },
  name: 'secureSessionId',
  rolling: true,
  unset: 'destroy'
};

if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  sessionConfig.cookie.secure = true;
}

app.use(session(sessionConfig));
app.use(flash());

// Protección CSRF (solo para rutas web, no API)
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});
app.use('/web', csrfProtection);

// Headers adicionales de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Feature-Policy', "geolocation 'none'; microphone 'none'; camera 'none'");
  next();
});

// Validación básica de entradas (sanitización)
app.use((req, res, next) => {
  for (const key in req.query) {
    if (typeof req.query[key] === 'string') {
      req.query[key] = escape(req.query[key]);
    }
  }
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = escape(req.body[key]);
      }
    }
  }
  next();
});

// ==================== MIDDLEWARES ADICIONALES ====================
app.use(fileUpload({
  createParentPath: true,
  limits: { fileSize: 5 * 1024 * 1024 },
  abortOnLimit: true,
  safeFileNames: true,
  preserveExtension: true
}));

app.use(compression());

// Middleware para respuestas estandarizadas
app.use((req, res, next) => {
  res.apiResponse = (data, status = 200, message = '') =>
    res.status(status).json({ success: true, message, data });

  res.apiError = (message, status = 400, errors = null) =>
    res.status(status).json({ success: false, message, errors });

  next();
});

// ==================== RUTAS DE LA APP ====================
app.use('/api/auth', authRoutes);         // Rutas de autenticación
app.use('/api/roles', rolesRoutes);       // Rutas para asignar y consultar roles

// ==================== RUTAS DE PRUEBA ====================
app.get('/', (req, res) => {
  logger.api('Acceso a ruta principal');
  res.apiResponse('API funcionando correctamente', 200, 'Bienvenido a la API');
});

app.get('/health', (req, res) => {
  logger.api('Health check solicitado');
  res.apiResponse({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  }, 200, 'Sistema funcionando correctamente');
});

app.get('/csrf-token', csrfProtection, (req, res) => {
  const token = req.csrfToken();
  res.json({ csrfToken: token });
});

// ==================== MANEJO DE ERRORES ====================
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  logger.error(`Error: ${err.message}\nStack: ${err.stack}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ success: false, message: 'Validation error', errors: err.errors });
  }

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ success: false, message: 'CSRF token validation failed' });
  }

  const errorResponse = {
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  };

  res.status(500).json(errorResponse);
});

app.use((req, res) => {
  logger.api(`❌ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Endpoint not found' });
});

// ==================== INICIAR SERVIDOR ====================
const startServer = async () => {
  try {
    const testConnection = new MySQLStore({
      host: MYSQLHOST,
      port: MYSQLPORT,
      user: MYSQLUSER,
      password: MYSQLPASSWORD,
      database: MYSQLDATABASE,
      createDatabaseTable: true
    });

    logger.database('Conexión a la base de datos MySQL establecida correctamente');
    logger.database(`Base de datos: ${MYSQLDATABASE}`);
    logger.database(`Host: ${MYSQLHOST}:${MYSQLPORT}`);

    app.listen(app.get('port'), () => {
      logger.server(`Servidor iniciado en puerto ${app.get('port')}`);
      logger.server(`Servidor corriendo en: http://localhost:${app.get('port')}`);
      logger.server(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      logger.success(`${logIcons.success} ✨ ¡Aplicación lista para usar!`);
    });

  } catch (error) {
    logger.error(`${logIcons.error} 💥 Error al iniciar el servidor:`, error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  logger.server(`${logIcons.server} 🛑 Recibida señal SIGINT. Cerrando servidor...`);
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.server(`${logIcons.server} 🛑 Recibida señal SIGTERM. Cerrando servidor...`);
  process.exit(0);
});

startServer();

module.exports = app;
