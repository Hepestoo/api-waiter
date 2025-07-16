const express = require('express');
const router = express.Router();
const rolesController = require('../controller/roles.controller');

// POST: Asignar un rol a un usuario
router.post('/assign', rolesController.asignarRol);

// GET: Obtener roles de un usuario
router.get('/usuario/:userId', rolesController.obtenerRoles);

module.exports = router;
