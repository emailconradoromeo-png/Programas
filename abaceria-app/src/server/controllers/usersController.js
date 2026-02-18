const bcrypt = require('bcryptjs');
const { User } = require('../models');

const usersController = {
  async getAll(req, res) {
    try {
      const users = await User.findAll({
        attributes: ['id', 'nombre', 'email', 'rol', 'activo', 'createdAt', 'updatedAt'],
        order: [['id', 'ASC']],
      });
      res.json(users);
    } catch (err) {
      console.error('Error en getAll users:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async getById(req, res) {
    try {
      const user = await User.findByPk(req.params.id, {
        attributes: ['id', 'nombre', 'email', 'rol', 'activo', 'createdAt', 'updatedAt'],
      });
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json(user);
    } catch (err) {
      console.error('Error en getById user:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async create(req, res) {
    try {
      const { nombre, email, password, rol } = req.body;
      if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y password son requeridos' });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: 'La password debe tener al menos 6 caracteres' });
      }

      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({
        nombre,
        email,
        password_hash,
        rol: rol || 'cajero',
      });

      res.status(201).json({
        id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, activo: user.activo,
      });
    } catch (err) {
      console.error('Error en create user:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async update(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { nombre, email, rol, activo } = req.body;

      if (email && email !== user.email) {
        const existing = await User.findOne({ where: { email } });
        if (existing) {
          return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
        }
      }

      if (nombre !== undefined) user.nombre = nombre;
      if (email !== undefined) user.email = email;
      if (rol !== undefined) user.rol = rol;
      if (activo !== undefined) user.activo = activo;

      await user.save();

      res.json({
        id: user.id, nombre: user.nombre, email: user.email, rol: user.rol, activo: user.activo,
      });
    } catch (err) {
      console.error('Error en update user:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async resetPassword(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'La nueva password debe tener al menos 6 caracteres' });
      }

      user.password_hash = await bcrypt.hash(newPassword, 10);
      await user.save();

      res.json({ message: 'Password reseteada exitosamente' });
    } catch (err) {
      console.error('Error en resetPassword:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  async remove(req, res) {
    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Prevent deleting the only admin
      if (user.rol === 'admin') {
        const adminCount = await User.count({ where: { rol: 'admin', activo: true } });
        if (adminCount <= 1) {
          return res.status(400).json({ error: 'No se puede eliminar el unico administrador' });
        }
      }

      // Prevent self-deletion
      if (user.id === req.user.id) {
        return res.status(400).json({ error: 'No puede eliminarse a si mismo' });
      }

      await user.destroy();
      res.json({ message: 'Usuario eliminado' });
    } catch (err) {
      console.error('Error en remove user:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },
};

module.exports = usersController;
