const express = require('express');
const router = express.Router();
const controller = require('../controllers/viajeAsiento.controller');
const  { verifyToken }  = require('../middleware/auth.middleware');

// 🔒 Reservar asiento (bloqueo temporal)
router.post('/reservar', verifyToken, controller.reservarAsiento);

// 💳 Comprar asiento (compra directa)
router.post('/comprar', verifyToken, controller.comprarAsiento);

// ✅ Confirmar compra (desde reserva)
router.post('/confirmar', verifyToken, controller.confirmarAsiento);

// 🔄 Liberar asientos vencidos
router.post('/liberar', verifyToken, controller.liberarAsientos);

router.post('/cancelar',verifyToken,controller.cancelarReserva);
router.post(
  '/cancelar-reservas-multiples',verifyToken  ,controller.cancelarReservasMultiples
);
router.get('/',verifyToken, controller.getViajeAsientosByViaje);

module.exports = router;