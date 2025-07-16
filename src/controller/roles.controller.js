// ==================== IMPORTACIÓN DE SERVICIO ====================
const rolesService = require('../servicio/roles.service'); // Lógica de negocio de roles

// ==================== CONTROLADOR: Asignar rol ====================
const asignarRol = async (req, res) => {
  try {
    const { userId, rolId } = req.body; // Extrae los IDs del usuario al que se le asignará el rol

    // Extraer el ID del usuario autenticado (solicitante), desde la sesión
    const idSolicitante = req.session?.user?.id; // Asegúrate que el login guarda req.session.user.id

    if (!idSolicitante) {
      return res.status(401).json({ 
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    // Llamar al servicio que maneja la lógica de validación y asignación
    const resultado = await rolesService.asignarRol(userId, rolId, idSolicitante);

    // Si todo salió bien, responder con éxito
    res.status(200).json({ success: true, ...resultado });

  } catch (error) {
    // Manejo de errores y enviar mensaje personalizado
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== CONTROLADOR: Obtener roles de un usuario ====================
const obtenerRoles = async (req, res) => {
  try {
    const { userId } = req.params; // ID del usuario del que queremos consultar sus roles

    // Llama al servicio que devuelve los roles del usuario
    const roles = await rolesService.obtenerRolesDeUsuario(userId);

    // Enviar respuesta exitosa con la lista de roles
    res.status(200).json({ success: true, roles });

  } catch (error) {
    // Si hay error, devolver respuesta con el mensaje
    res.status(400).json({ success: false, message: error.message });
  }
};

// ==================== EXPORTACIÓN DE FUNCIONES DEL CONTROLADOR ====================
module.exports = {
  asignarRol,
  obtenerRoles
};
