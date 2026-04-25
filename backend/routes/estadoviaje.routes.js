// routes/estadoviaje.routes.js
const express = require('express');
const router = express.Router();
const estadoviajeController = require('../controllers/estadoviaje.controller');

router.get('/', estadoviajeController.getEstadosViaje);
router.get('/:id', estadoviajeController.getEstadoById);
router.post('/', estadoviajeController.createEstado);
router.put('/:id', estadoviajeController.updateEstado);
router.delete('/:id', estadoviajeController.deleteEstado);

module.exports = router;