const express = require('express');
const router = express.Router();

const ViajeController = require('../controllers/viajes.controller');


// 🔹 Obtener todos
router.get('/', ViajeController.getAllViajes);

// 🔹 Obtener por ID
router.get('/:id', ViajeController.getViajeById);

// 🔹 Crear
router.post('/', ViajeController.createViaje);

// 🔹 Actualizar
router.put('/:id', ViajeController.updateViaje);

// 🔹 Eliminar
router.delete('/:id', ViajeController.deleteViaje);


module.exports = router;