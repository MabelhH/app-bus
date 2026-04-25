// backend/src/routes/rol.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
} = require('../controllers/rol.controller');

// Todas las rutas de roles requieren autenticación
router.use(verifyToken);

// Rutas CRUD
router.get('/', getAllRoles);           // GET /api/rol
router.get('/:id', getRoleById);        // GET /api/rol/:id
router.post('/', createRole);            // POST /api/rol
router.put('/:id', updateRole);          // PUT /api/rol/:id
router.delete('/:id', deleteRole);       // DELETE /api/rol/:id

module.exports = router;