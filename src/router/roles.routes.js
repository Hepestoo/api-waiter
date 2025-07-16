const express = require('express');
const router = express.Router();

const rolesController = require('../controller/roles.controller');
const { Usuario, Rol } = require('../Database/dataBase.orm'); // 👈 Necesario para el middleware

// ==================== MIDDLEWARE: isSuperadmin ====================
const isSuperadmin = async (req, res, next) => {
  try {
    const userId = req.session?.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    const usuario = await Usuario.findByPk(userId, {
      include: Rol
    });

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const tieneSuperadmin = usuario.roles.some(r => r.nombreRol === 'superadmin');

    if (!tieneSuperadmin) {
      return res.status(403).json({ message: 'Acceso restringido a superadmins' });
    }

    next();

  } catch (err) {
    console.error('Error en isSuperadmin:', err);
    res.status(500).json({ message: 'Error interno de autenticación' });
  }
};

// ==================== RUTAS EXISTENTES ====================
router.post('/assign', rolesController.asignarRol);
router.get('/usuario/:userId', rolesController.obtenerRoles);

// ==================== RUTA PROTEGIDA SOLO PARA SUPERADMIN ====================
router.get('/solo-superadmin', isSuperadmin, (req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ Bienvenido superadmin. Tienes acceso autorizado.'
  });
});

module.exports = router;
