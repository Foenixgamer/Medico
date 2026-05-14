// =============================================================================
// MedSecure - Rutas de administración
// Capa 13: Endpoint de eventos de seguridad (solo admin)
// Capa 12: Consulta de audit logs
// =============================================================================

const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { checkRole, requireDoubleConfirm, ROLES } = require('../middleware/rbac');
const { pool } = require('../config/database');
const { logger } = require('../utils/logger');

const router = Router();

router.use(authenticate);
router.use(checkRole(ROLES.ADMIN));

// =============================================================================
// Listar eventos de seguridad recientes
// GET /api/admin/security-events
// =============================================================================
router.get('/security-events', async (req, res, next) => {
  try {
    const { resolved, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM security_events';
    const params = [];
    const conditions = [];

    if (resolved !== undefined) {
      conditions.push(`resolved = $${params.length + 1}`);
      params.push(resolved === 'true');
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY detected_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      events: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// Resolver evento de seguridad
// POST /api/admin/security-events/:id/resolve
// =============================================================================
router.post('/security-events/:id/resolve', requireDoubleConfirm, async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE security_events SET resolved = true WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Evento no encontrado',
        code: 'EVENT_NOT_FOUND',
      });
    }

    logger.info('Evento de seguridad resuelto', {
      adminId: req.user.id,
      eventId: id,
    });

    res.json({
      message: 'Evento marcado como resuelto',
    });
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// Consultar audit logs
// GET /api/admin/audit-logs
// =============================================================================
router.get('/audit-logs', async (req, res, next) => {
  try {
    const { userId, action, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT * FROM audit_logs';
    const params = [];
    const conditions = [];

    if (userId) {
      conditions.push(`user_id = $${params.length + 1}`);
      params.push(userId);
    }
    if (action) {
      conditions.push(`action = $${params.length + 1}`);
      params.push(action);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY timestamp DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({
      logs: result.rows,
      total: result.rows.length,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
