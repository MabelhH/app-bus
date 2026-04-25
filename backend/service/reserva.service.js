// service/reserva.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getReservaActiva = async (userId, viajeId = null) => {
  try {
    const ahora = new Date();

    // ✅ Cambiar de "ACTIVA" a "RESERVADO"
    const whereCondition = {
      userId: userId,
      estado: {
        nombre: "RESERVADO"  // ← Cambiado de "ACTIVA" a "RESERVADO"
      }
    };
    
    // Si se proporciona viajeId, filtrar por él
    if (viajeId) {
      whereCondition.viajeId = viajeId;
    }

    const reserva = await prisma.reserva.findFirst({
      where: whereCondition,
      include: {
        viaje: true,
        estado: true,
        boletos: {
          include: {
            asiento: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!reserva) return null;

    // Si no hay boletos, la reserva no tiene asientos asignados
    if (!reserva.boletos || reserva.boletos.length === 0) return null;

    const asientoIds = reserva.boletos.map(b => b.asientoId);

    // Obtener el reservadoHasta real desde viaje_asiento
    const viajeAsientos = await prisma.viaje_asiento.findMany({
      where: {
        viajeId: reserva.viajeId,
        asientoId: { in: asientoIds }
      },
      select: { reservadoHasta: true }
    });

    // Usar la expiración más próxima (la que vence antes)
    const fechasExpiracion = viajeAsientos
      .map(va => va.reservadoHasta)
      .filter(Boolean)
      .map(f => new Date(f));

    const reservadoHasta = fechasExpiracion.length > 0
      ? new Date(Math.min(...fechasExpiracion.map(f => f.getTime())))
      : (() => {
          const fallback = new Date(reserva.createdAt);
          fallback.setMinutes(fallback.getMinutes() + 5);
          return fallback;
        })();

    const tiempoRestante = Math.floor((reservadoHasta - ahora) / 1000);

    // Si ya expiró, no devolver la reserva
    if (tiempoRestante <= 0) return null;

    return {
      reservaId: reserva.id,
      viajeId: reserva.viajeId,
      asientosIds: asientoIds,
      asientosNumeros: reserva.boletos.map(b => b.asiento.numeroAsiento),
      tiempoRestante,
      reservadoHasta: reservadoHasta.toISOString()
    };
    
  } catch (error) {
    console.error('❌ Error en getReservaActiva service:', error);
    throw error;
  }
};

module.exports = {
  getReservaActiva
};