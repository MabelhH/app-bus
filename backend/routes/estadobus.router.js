// backend/routes/estadobus.router.js
const express = require('express');
const router = express.Router();
const estadoBusController = require('../controllers/estadobus.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Rutas protegidas con token
router.get('/', verifyToken, estadoBusController.getEstados);
router.get('/estadisticas', verifyToken, estadoBusController.getEstadisticas);
router.get('/:id', verifyToken, estadoBusController.getEstadoById);
router.get('/nombre/:nombre', verifyToken, estadoBusController.getEstadoByNombre);
router.post('/', verifyToken, estadoBusController.createEstado);
router.put('/:id', verifyToken, estadoBusController.updateEstado);
router.delete('/:id', verifyToken, estadoBusController.deleteEstado);

module.exports = router;