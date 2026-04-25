// routes/asientos.routes.js
const express = require('express');
const router = express.Router();
const asientosController = require('../controllers/asientos.controller');

// Rutas para asientos - SIN MIDDLEWARE por ahora
router.get('/', asientosController.getAsientos);
router.get('/bus/:busId', asientosController.getAsientosByBus);
router.get('/:id', asientosController.getAsientoById);
router.post('/', asientosController.createAsiento);
router.post('/multiple', asientosController.createMultipleAsientos);
router.put('/:id', asientosController.updateAsiento);
router.delete('/:id', asientosController.deleteAsiento);
router.delete('/bus/:busId', asientosController.deleteAsientosByBus);
router.post('/buses/:busId/agregar-asientos',  asientosController.agregarAsientos);
router.put('/buses/:busId/capacidad',asientosController.actualizarCapacidad);
router.get('/viajes/:viajeId/asientos', asientosController.getAsientosPorViaje);

module.exports = router;