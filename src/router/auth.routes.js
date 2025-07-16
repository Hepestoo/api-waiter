const express = require('express');
const router = express.Router();
const authController = require('../controller/auth.controller');

// Middleware de validación básica
const validateAuth = (req, res, next) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  next();
};

router.post('/register', validateAuth, authController.register);
router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;