// controllers/reserva.controller.js
const reservaService = require('../service/reserva.service');

const obtenerReservaActiva = async (req, res) => {
  try {
    const { userId } = req.params;
    const { viajeId } = req.query;
    
    console.log('📥 obtenerReservaActiva llamado:', { userId, viajeId });
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'userId es requerido'
      });
    }
    
    // ✅ Pasar viajeId al servicio
    const reserva = await reservaService.getReservaActiva(userId, viajeId);
    
    if (!reserva) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'No hay reserva activa'
      });
    }

    console.log('✅ Reserva activa encontrada:', reserva.reservaId);
    
    return res.status(200).json({
      success: true,
      data: reserva,
      message: 'Reserva activa encontrada'
    });
    
  } catch (error) {
    console.error('❌ Error en obtenerReservaActiva:', error);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  obtenerReservaActiva
};