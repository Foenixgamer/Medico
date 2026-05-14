const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { checkRole, ROLES } = require('../middleware/rbac');
const ctrl = require('./controller');

const router = Router();

router.use(authenticate);

// Listar usuarios: con ?role=filtro cualquier auth; sin filtro solo admin
router.get('/', ctrl.getAll);
router.get('/:id', checkRole(ROLES.ADMIN, ROLES.MASTER), ctrl.getOne);
router.post('/', checkRole(ROLES.MASTER), ctrl.create);
router.patch('/:id', checkRole(ROLES.ADMIN, ROLES.MASTER), ctrl.update);
router.patch('/:id/role', checkRole(ROLES.MASTER), ctrl.changeRole);
router.patch('/:id/toggle', checkRole(ROLES.MASTER), ctrl.toggleActive);
router.delete('/:id', checkRole(ROLES.MASTER), ctrl.remove);

module.exports = router;