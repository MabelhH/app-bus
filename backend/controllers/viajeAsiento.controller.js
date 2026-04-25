// backend/controllers/viajeAsiento.controller.js
const viajeAsientoService = require('../service/viajeAsiento.service');

const comprarAsiento = async (req, res) => {
  try {
    console.log('🎮 CONTROLADOR: comprarAsiento');

    const { viajeId, asientoId } = req.body;
    const userId = req.user?.id;

    console.log('📥 Datos recibidos:', { viajeId, asientoId, userId });

    if (!viajeId || !asientoId) {
      return res.status(400).json({
        success: false,
        message: "viajeId y asientoId son obligatorios"
      });
    }

    const result = await viajeAsientoService.comprarAsiento({
      viajeId,
      asientoId,
      userId
    });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Error en comprarAsiento controller:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

/**
 * 🔒 RESERVAR ASIENTO (bloqueo temporal 5 min)
 */
const reservarAsiento = async (req, res) => {
  try {
    console.log('🎮 CONTROLADOR: reservarAsiento');

    const { viajeId, asientoId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Usuario no autenticado"
    });
  }

    console.log('📥 Datos recibidos:', { viajeId, asientoId, userId });

    if (!viajeId || !asientoId) {
      return res.status(400).json({
        success: false,
        message: "viajeId y asientoId son obligatorios"
      });
    }

    const result = await viajeAsientoService.reservarAsiento({
      viajeId,
      asientoId,
      userId
    });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Error en reservarAsiento controller:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

/**
 * ✅ CONFIRMAR COMPRA (desde reserva)
 */
const confirmarAsiento = async (req, res) => {
  try {
    console.log('🎮 CONTROLADOR: confirmarAsiento');

    const { viajeId, asientoId } = req.body;
    const userId = req.user?.id;

    console.log('📥 Datos recibidos:', { viajeId, asientoId, userId });

    if (!viajeId || !asientoId) {
      return res.status(400).json({
        success: false,
        message: "viajeId y asientoId son obligatorios"
      });
    }

    const result = await viajeAsientoService.confirmarAsiento({
      viajeId,
      asientoId,
      userId
    });

    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }

  } catch (error) {
    console.error('❌ Error en confirmarAsiento controller:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

/**
 * 🔄 LIBERAR ASIENTOS VENCIDOS
 */
const liberarAsientos = async (req, res) => {
  try {
    console.log('🎮 CONTROLADOR: liberarAsientosVencidos');

    await viajeAsientoService.liberarAsientosVencidos();

    return res.status(200).json({
      success: true,
      message: "Asientos vencidos liberados"
    });

  } catch (error) {
    console.error('❌ Error en liberarAsientos:', error);
    return res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    });
  }
};

const cancelarReserva = async (req, res) => {
  try {
    console.log('🎮 CONTROLADOR: cancelarReserva');
    
    const { viajeId, asientoId } = req.body;
    const userId = req.user?.id;
    
    console.log('📥 Datos recibidos:', { viajeId, asientoId, userId });
    
    if (!viajeId || !asientoId) {
      return res.status(400).json({
        success: false,
        message: "viajeId y asientoId son obligatorios"
      });
    }
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado"
      });
    }
    
    const result = await viajeAsientoService.cancelarReserva({
      viajeId,
      asientoId,
      userId
    });
    
    if (result.success) {
      return res.status(200).json(result);
    } else {
      return res.status(400).json(result);
    }
    
  } catch (error) {
    console.error('❌ Error en cancelarReserva controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error interno del servidor"
    });
  }
};

const cancelarReservasMultiples = async (req, res) => {
  try {
    console.log('🎮 CONTROLADOR: cancelarReservasMultiples');

    const { viajeId, asientosIds } = req.body;
    const userId = req.user?.id;

    console.log('📥 Datos recibidos:', { viajeId, asientosIds, userId });

    if (!viajeId || !asientosIds || asientosIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos"
      });
    }

    const result = await viajeAsientoService.cancelarReservasMultiples({
      viajeId,
      asientosIds,
      userId
    });

    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('❌ Error en cancelarReservasMultiples controller:', error);
    return res.status(500).json({
      success: false,
      message: error.message || "Error interno"
    });
  }
};


const getViajeAsientosByViaje = async (req, res) => {
  try {
    const { viajeId } = req.query;
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    console.log('📊 Consultando viaje_asiento con viajeId:', viajeId);

    const where = {};
    if (viajeId) {
      where.viajeId = viajeId;
    }

    // Liberar asientos RESERVADO con reservadoHasta nulo o vencido
    if (viajeId) {
      const [estadoLibre, estadoReservado] = await Promise.all([
        prisma.estadoviajeasiento.findFirst({ where: { nombre: { equals: 'LIBRE', mode: 'insensitive' } } }),
        prisma.estadoviajeasiento.findFirst({ where: { nombre: { in: ['RESERVADO', 'Reservado'] } } })
      ]);

      if (estadoLibre && estadoReservado) {
        const ahora = new Date();
        await prisma.viaje_asiento.updateMany({
          where: {
            viajeId,
            estadoId: estadoReservado.id,
            OR: [
              { reservadoHasta: null },
              { reservadoHasta: { lt: ahora } }
            ]
          },
          data: {
            estadoId: estadoLibre.id,
            reservadoHasta: null,
            reservadoPor: null,
            reservaId: null
          }
        });
      }
    }

    const viajeAsientos = await prisma.viaje_asiento.findMany({
      where,
      include: {
        asiento: true,
        estado: true,
        viaje: {
          include: {
            ruta: true,
            bus: true
          }
        }
      }
    });

    console.log('📊 Encontrados:', viajeAsientos.length);

    // Formatear respuesta para el frontend
    const asientosFormateados = viajeAsientos.map(va => ({
      id: va.id,
      viajeAsientoId: va.id,
      numeroAsiento: va.asiento?.numeroAsiento,
      estado: va.estado?.nombre,
      estadoId: va.estadoId,
      asientoId: va.asientoId,
      viajeId: va.viajeId,
      reservadoPor: va.reservadoPor,
      reservadoHasta: va.reservadoHasta,
      disponible: va.estado?.nombre === 'LIBRE'
    }));

    res.json({
      success: true,
      data: asientosFormateados,
      count: asientosFormateados.length
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


module.exports = {
  reservarAsiento,
  confirmarAsiento,
  comprarAsiento,
  liberarAsientos,
  cancelarReserva,
  cancelarReservasMultiples,
  getViajeAsientosByViaje
};