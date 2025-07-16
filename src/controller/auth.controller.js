const authService = require('../servicio/auth.service');

class AuthController {
  async register(req, res) {
    try {
      const { username, email, password, name } = req.body;
      const user = await authService.registerUser({ username, email, password, name });
      res.status(201).json({
        id: user.idUser,
        username: user.userName,
        email: user.emailUser
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const user = await authService.loginUser({ email, password });
      
      // Guardar en sesión si usas sesiones
      if (req.session) {
        req.session.user = user;
      }
      
      res.status(200).json(user);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  logout(req, res) {
    if (req.session) {
      req.session.destroy();
    }
    res.status(200).json({ message: 'Logout exitoso' });
  }
}

module.exports = new AuthController();