const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { JWT_SECRET } = require('../middleware/auth');

const authController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y password son requeridos' });
      }

      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: 'Credenciales invalidas' });
      }

      if (!user.activo) {
        return res.status(401).json({ error: 'Usuario desactivado' });
      }

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Credenciales invalidas' });
      }

      const token = jwt.sign(
        { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        token,
        user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
      });
    } catch (err) {
      console.error('Error en login:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async me(req, res) {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: ['id', 'nombre', 'email', 'rol', 'activo'],
      });
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    } catch (err) {
      console.error('Error en me:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password actual y nueva son requeridos' });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva password debe tener al menos 6 caracteres' });
      }

      const user = await User.findByPk(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const valid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Password actual incorrecta' });
      }

      user.password_hash = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'Password actualizada exitosamente' });
    } catch (err) {
      console.error('Error en changePassword:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = authController;
