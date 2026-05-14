const bcrypt = require('bcrypt');
const { pool } = require('../config/database');
const { logger, auditLog } = require('../utils/logger');

exports.getAll = async (req, res, next) => {
  try {
    const { role } = req.query;

    // Si hay filtro de rol, cualquier auth puede listar (para selects)
    if (role) {
      const { rows } = await pool.query(
        'SELECT id, email, role FROM users WHERE role = $1 ORDER BY email',
        [role]
      );
      return res.json({ users: rows });
    }

    // Sin filtro: solo admin o master
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'master')) {
      return res.status(403).json({
        error: 'No tienes permisos para esta acción',
        code: 'FORBIDDEN_ROLE',
      });
    }

    const { rows } = await pool.query(`
      SELECT id, name, email, role, is_active,
             totp_enabled as mfa_enabled, created_at, last_login_at
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, is_active, totp_enabled as mfa_enabled,
              specialty, phone, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  const { name, email, password, role, specialty, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      message: 'Nombre, correo, contraseña y rol son obligatorios',
    });
  }

  const allowedRoles = ['admin', 'doctor', 'nurse', 'patient', 'master'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: 'Rol no válido' });
  }

  try {
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1', [email]
    );
    if (existing.rows.length) {
      return res.status(409).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(`
      INSERT INTO users (name, email, password_hash, role, specialty, phone, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, true)
      RETURNING id, name, email, role, is_active, created_at
    `, [name, email, hashedPassword, role, specialty || null, phone || null]);

    auditLog({
      userId: req.user.id,
      action: 'CREATE',
      resourceId: rows[0].id,
      resourceType: 'user',
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'unknown',
    });

    logger.info('Usuario creado', { userId: req.user.id, newUserId: rows[0].id });

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      user: rows[0],
    });
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  const { name, email, specialty, phone, password } = req.body;
  try {
    if (password) {
      if (req.user?.role !== 'master') {
        return res.status(403).json({ message: 'Solo master puede cambiar contraseñas' });
      }
      if (password.length < 8) {
        return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
      }
      const hashedPassword = await bcrypt.hash(password, 12);
      const { rows } = await pool.query(`
        UPDATE users SET
          name = COALESCE($1, name),
          email = COALESCE($2, email),
          specialty = COALESCE($3, specialty),
          phone = COALESCE($4, phone),
          password_hash = $5,
          updated_at = NOW()
        WHERE id = $6
        RETURNING id, name, email, role
      `, [name, email, specialty, phone, hashedPassword, req.params.id]);

      if (!rows.length) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      return res.json({ message: 'Usuario actualizado y contraseña cambiada', user: rows[0] });
    }

    const { rows } = await pool.query(`
      UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        specialty = COALESCE($3, specialty),
        phone = COALESCE($4, phone),
        updated_at = NOW()
      WHERE id = $5
      RETURNING id, name, email, role
    `, [name, email, specialty, phone, req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json({ message: 'Usuario actualizado', user: rows[0] });
  } catch (err) {
    next(err);
  }
};

exports.changeRole = async (req, res, next) => {
  const { role } = req.body;
  const allowedRoles = ['admin', 'doctor', 'nurse', 'patient'];
  if (!allowedRoles.includes(role) && req.user?.role !== 'master') {
    return res.status(400).json({ message: 'Rol no válido' });
  }
  try {
    await pool.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2',
      [role, req.params.id]
    );
    res.json({ message: 'Rol actualizado' });
  } catch (err) {
    next(err);
  }
};

exports.toggleActive = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW()
       WHERE id = $1 RETURNING id, is_active`,
      [req.params.id]
    );
    res.json({
      message: rows[0].is_active ? 'Usuario activado' : 'Usuario desactivado',
      is_active: rows[0].is_active,
    });
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    await pool.query(
      'DELETE FROM users WHERE id = $1 AND role != $2 AND role != $3',
      [req.params.id, 'admin', 'master']
    );
    res.json({ message: 'Usuario eliminado' });
  } catch (err) {
    next(err);
  }
};