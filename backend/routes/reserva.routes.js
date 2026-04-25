const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reserva.controller');
const { verifyToken } = require('../middleware/auth.middleware');

router.get('/activa/:userId', verifyToken, reservaController.obtenerReservaActiva);

module.exports = router;