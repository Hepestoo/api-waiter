const bcrypt = require('bcrypt');
const { Usuario, Rol, UsuarioRol } = require('../Database/dataBase.orm'); // Asegúrate que esta ruta sea correcta
const { Op } = require('sequelize');

const saltRounds = 10;

// ==================== REGISTRO DE USUARIO ====================
const registerUser = async ({ username, email, password, name }) => {
  // Validación de campos requeridos
  if (!username || !email || !password) {
    throw new Error('Todos los campos son requeridos');
  }

  // Verificar si el usuario ya existe (por email o username)
  const existingUser = await Usuario.findOne({
    where: {
      [Op.or]: [
        { emailUser: email },
        { userName: username }
      ]
    }
  });

  if (existingUser) {
    throw new Error('El email o nombre de usuario ya está registrado');
  }

  // Hashear la contraseña
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Crear el nuevo usuario
  const nuevoUsuario = await Usuario.create({
    userName: username,
    emailUser: email,
    passwordUser: hashedPassword,
    nameUsers: name || '',
    stateUser: 'active'
  });

  // Buscar el rol "cliente"
  const rolCliente = await Rol.findOne({ where: { nombreRol: 'cliente' } });

  if (!rolCliente) {
    throw new Error('El rol "cliente" no está disponible en la base de datos');
  }

  // Asignar el rol "cliente" al nuevo usuario
  await UsuarioRol.create({
    idUsuario: nuevoUsuario.idUser,
    idRol: rolCliente.idRol
  });

  // Retornar el usuario creado (sin contraseña)
  return nuevoUsuario;
};

// ==================== LOGIN DE USUARIO ====================
const loginUser = async ({ email, password }) => {
  // Buscar al usuario e incluir sus roles
  const user = await Usuario.findOne({
    where: { emailUser: email },
    include: {
      model: Rol,
      through: { attributes: [] } // No incluir datos de la tabla intermedia
    }
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar la contraseña
  const validPassword = await bcrypt.compare(password, user.passwordUser);
  if (!validPassword) {
    throw new Error('Contraseña incorrecta');
  }

  // Extraer nombres de roles
  const roles = user.roles.map(r => r.nombreRol);

  // Retornar info del usuario con sus roles
  return {
    id: user.idUser,
    username: user.userName,
    email: user.emailUser,
    roles
  };
};

// ==================== EXPORTAR FUNCIONES ====================
module.exports = {
  registerUser,
  loginUser
};
