// const express = require('express');
// const router = express.Router();
// const busController = require('../controllers/buses.controller');
// const { verifyToken } = require('../middleware/auth.middleware');

// // Middleware de autenticación para todas las rutas
// router.use(verifyToken);

// // Rutas para buses
// router.get('/', busController.getBuses);
// router.get('/:id', busController.getBusById);
// router.post('/', busController.createBus);
// router.put('/:id', busController.updateBus);
// router.delete('/:id', busController.deleteBus);

// // Rutas para ubicación de buses
// router.post('/:id/ubicacion', busController.reportarUbicacion);
// router.get('/:id/ubicacion', busController.obtenerUltimaUbicacion);
// router.get('/activos', busController.obtenerBusesActivos);
// router.get('/:id/ubicacion/historial', busController.obtenerHistorialUbicaciones);

// module.exports = router;
const express = require('express');
const router = express.Router();
const busController = require('../controllers/buses.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.use(verifyToken);

// ========== RUTAS FIJAS (sin parámetros) ==========
router.get('/', busController.getBuses);
router.get('/activos', busController.obtenerBusesActivos);      // ← mover aquí

// ========== RUTAS CON PARÁMETROS ==========
router.get('/:id', busController.getBusById);
router.post('/', busController.createBus);
router.put('/:id', busController.updateBus);
router.delete('/:id', busController.deleteBus);

// Rutas con parámetros para ubicación
router.post('/:id/ubicacion', busController.reportarUbicacion);
router.get('/:id/ubicacion', busController.obtenerUltimaUbicacion);
router.get('/:id/ubicacion/historial', busController.obtenerHistorialUbicaciones);

module.exports = router;