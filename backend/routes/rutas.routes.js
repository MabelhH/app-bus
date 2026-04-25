const express = require('express');
const router = express.Router();

const RutaController = require('../controllers/rutas.controller');


// 🔹 Obtener todas las rutas
router.get('/', RutaController.getAllRutas);

// 🔹 Obtener ruta por ID
router.get('/:id', RutaController.getRutaById);

// 🔹 Crear ruta
router.post('/', RutaController.createRuta);

// 🔹 Actualizar ruta
router.put('/:id', RutaController.updateRuta);

// 🔹 Eliminar ruta
router.delete('/:id', RutaController.deleteRuta);


module.exports = router;