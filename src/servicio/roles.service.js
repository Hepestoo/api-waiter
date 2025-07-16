const { Usuario, Rol, UsuarioRol } = require('../Database/dataBase.orm');

// Asignar rol a usuario
const asignarRol = async (userId, rolId) => {
  // Validar existencia de usuario y rol
  const usuario = await Usuario.findByPk(userId);
  const rol = await Rol.findByPk(rolId);

  if (!usuario) throw new Error('Usuario no encontrado');
  if (!rol) throw new Error('Rol no encontrado');

  // Verificar si ya tiene ese rol
  const yaExiste = await UsuarioRol.findOne({
    where: {
      idUsuario: userId,
      idRol: rolId
    }
  });

  if (yaExiste) throw new Error('El usuario ya tiene este rol asignado');

  // Crear la relación
  await UsuarioRol.create({
    idUsuario: userId,
    idRol: rolId
  });

  return { message: 'Rol asignado correctamente' };
};

// Consultar roles de un usuario
const obtenerRolesDeUsuario = async (userId) => {
  const usuario = await Usuario.findByPk(userId, {
    include: Rol
  });

  if (!usuario) throw new Error('Usuario no encontrado');

  return usuario.roles || [];
};

module.exports = {
  asignarRol,
  obtenerRolesDeUsuario
};
