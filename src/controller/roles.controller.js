const rolesService = require('../servicio/roles.service');

const asignarRol = async (req, res) => {
  try {
    const { userId, rolId } = req.body;
    const resultado = await rolesService.asignarRol(userId, rolId);
    res.status(200).json({ success: true, ...resultado });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const obtenerRoles = async (req, res) => {
  try {
    const { userId } = req.params;
    const roles = await rolesService.obtenerRolesDeUsuario(userId);
    res.status(200).json({ success: true, roles });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  asignarRol,
  obtenerRoles
};
