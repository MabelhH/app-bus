// routes/marca.routes.js
const express = require('express');
const router = express.Router();
const marcaController = require('../controllers/marca.controller');
const { verifyToken } = require('../middleware/auth.middleware'); // Nota: es 'middleware' no 'middlewares'

router.get('/test', (req, res) => {
  console.log('✅ Ruta de prueba /api/marcas/test fue llamada');
  res.json({
    success: true,
    message: 'Ruta de marcas funcionando correctamente',
    data: [
      { id: '1', nombre: 'MERCEDES BENZ' },
      { id: '2', nombre: 'SCANIA' },
      { id: '3', nombre: 'VOLVO' }
    ]
  });
});


// Middleware de autenticación para todas las rutas
router.use(verifyToken);

// Rutas para marcas
router.get('/', marcaController.getMarcas);
router.get('/:id', marcaController.getMarcaById);
router.post('/', marcaController.createMarca);
router.put('/:id', marcaController.updateMarca);
router.delete('/:id', marcaController.deleteMarca);

module.exports = router;