const { Usuario, Rol, UsuarioRol } = require('../Database/dataBase.orm');

// ==================== ASIGNAR ROL CON JERARQUÍA ====================
const asignarRol = async (userIdDestino, rolIdAsignar, idSolicitante) => {
  // Verificar parámetros obligatorios
  if (!userIdDestino || !rolIdAsignar || !idSolicitante) {
    throw new Error('Faltan parámetros');
  }

  // Buscar al usuario que realiza la asignación
  const solicitante = await Usuario.findByPk(idSolicitante, {
    include: Rol
  });

  if (!solicitante) {
    throw new Error('Usuario solicitante no válido');
  }

  const rolesSolicitante = solicitante.roles.map(r => r.nombreRol);

  // Buscar el rol que se quiere asignar
  const rol = await Rol.findByPk(rolIdAsignar);
  if (!rol) throw new Error('Rol no encontrado');

  const rolNombre = rol.nombreRol;

  // ========== REGLAS ==========
  if (rolNombre === 'superadmin') {
    throw new Error('No puedes asignar el rol superadmin');
  }

  if (rolNombre === 'admin') {
    if (!rolesSolicitante.includes('superadmin')) {
      throw new Error('Solo un superadmin puede asignar el rol admin');
    }
  }

  if (rolNombre === 'mesero') {
    if (!rolesSolicitante.includes('admin')) {
      throw new Error('Solo un admin puede asignar el rol mesero');
    }
  }

  // Verificar si ya tiene el rol asignado
  const yaTieneRol = await UsuarioRol.findOne({
    where: {
      idUsuario: userIdDestino,
      idRol: rolIdAsignar
    }
  });

  if (yaTieneRol) {
    throw new Error(`El usuario ya tiene el rol "${rolNombre}"`);
  }

  // Asignar el rol
  await UsuarioRol.create({
    idUsuario: userIdDestino,
    idRol: rolIdAsignar
  });

  return {
    message: `Rol "${rolNombre}" asignado correctamente al usuario ID ${userIdDestino}`
  };
};

// ==================== OBTENER ROLES DE UN USUARIO ====================
const obtenerRolesDeUsuario = async (userId) => {
  const usuario = await Usuario.findByPk(userId, {
    include: {
      model: Rol,
      through: { attributes: [] }
    }
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  return usuario.roles.map(r => ({
    idRol: r.idRol,
    nombreRol: r.nombreRol
  }));
};

module.exports = {
  asignarRol,
  obtenerRolesDeUsuario
};
