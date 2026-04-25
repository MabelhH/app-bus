const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const comprarAsiento = async ({ viajeId, asientoId, userId }) => {
  try {
    console.log('=== SERVICE: comprarAsiento ===');
    console.log('Datos:', { viajeId, asientoId, userId });
    
    if (!viajeId || !asientoId) {
      return { success: false, message: "Faltan datos: viajeId o asientoId" };
    }
    
    // 👈 BUSCAR ESTADO OCUPADO (con el nombre exacto de tu BD)
    const estadoOcupado = await prisma.estadoviajeasiento.findFirst({
      where: { 
        nombre: {
          equals: 'Ocupado',  // 👈 Usar "Ocupado" con mayúscula inicial
          mode: 'insensitive'
        }
      }
    });
    
    console.log('Estado OCUPADO encontrado:', estadoOcupado);

    if (!estadoOcupado) {
      console.log('❌ Estado OCUPADO no encontrado');
      return { success: false, message: "Error: Estado OCUPADO no configurado" };
    }

    // Buscar el registro del asiento en el viaje
    const registro = await prisma.viaje_asiento.findUnique({
      where: {
        viajeId_asientoId: {
          viajeId,
          asientoId
        }
      }
    });

    if (!registro) {
      console.log('❌ Asiento no encontrado');
      return { success: false, message: "Asiento no encontrado" };
    }

    console.log('Registro encontrado:', {
      estadoId: registro.estadoId,
      reservadoHasta: registro.reservadoHasta
    });

    // Actualizar directamente a OCUPADO
    const actualizado = await prisma.viaje_asiento.update({
      where: { id: registro.id },
      data: {
        estadoId: estadoOcupado.id,
        reservadoHasta: null,
        reservadoPor: userId
      }
    });

    console.log('✅ Asiento comprado exitosamente');
    return {
      success: true,
      data: actualizado,
      message: "Asiento comprado exitosamente"
    };

  } catch (error) {
    console.error('❌ Error en comprarAsiento:', error);
    return { success: false, message: error.message };
  }
};

const reservarAsiento = async ({ viajeId, asientoId, userId }) => {
  try {
    if (!viajeId || !asientoId) {
      return { success: false, message: "Faltan datos" };
    }

    const ahora = new Date();

    const registro = await prisma.viaje_asiento.findUnique({
      where: {
        viajeId_asientoId: { viajeId, asientoId }
      }
    });

    if (!registro) {
      return { success: false, message: "Asiento no existe" };
    }

    // 🔍 Estados
    const estadoReservado = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: { in: ['RESERVADO', 'Reservado'] } }
    });

    const estadoDisponible = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: { equals: 'LIBRE', mode: 'insensitive' } }
    });

    const estadoOcupado = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: { equals: 'OCUPADO', mode: 'insensitive' } }
    });

    const estadoReserva = await prisma.estadoreserva.findFirst({
      where: { nombre: { equals: 'PENDIENTE_PAGO', mode: 'insensitive' } }
    });

    if (!estadoReservado || !estadoDisponible || !estadoOcupado || !estadoReserva) {
      return { success: false, message: "Estados no configurados" };
    }

    // 🚫 Validar si está ocupado
    if (registro.estadoId === estadoOcupado.id) {
      return { success: false, message: "Asiento ya está ocupado" };
    }

    // 🚫 Validar reserva activa
    if (
      registro.estadoId === estadoReservado.id &&
      registro.reservadoHasta &&
      registro.reservadoHasta > ahora
    ) {
      return { success: false, message: "Asiento en uso por otro usuario" };
    }

    // 🔄 Si venció → liberar
    if (
      registro.estadoId === estadoReservado.id &&
      registro.reservadoHasta &&
      registro.reservadoHasta < ahora
    ) {
      await prisma.viaje_asiento.update({
        where: { id: registro.id },
        data: {
          estadoId: estadoDisponible.id,
          reservadoHasta: null,
          reservadoPor: null,
          reservaId: null
        }
      });
    }

    // 🔥 TRANSACCIÓN
    const result = await prisma.$transaction(async (tx) => {

      const reserva = await tx.reserva.create({
        data: {
          userId,
          viajeId,
          estadoId: estadoReserva.id
        }
      });

      const actualizado = await tx.viaje_asiento.update({
        where: { id: registro.id },
        data: {
          estadoId: estadoReservado.id,
          reservadoHasta: new Date(ahora.getTime() + 5 * 60000),
          reservadoPor: userId,
          reservaId: reserva.id
        }
      });

      return { reserva, actualizado };
    });

    return {
      success: true,
      data: result,
      message: "Asiento reservado correctamente"
    };

  } catch (error) {
    console.error(error);
    return { success: false, message: error.message };
  }
};
/**
 * ✅ CONFIRMAR COMPRA (desde reserva)
 */
// const confirmarAsiento = async ({ viajeId, asientoId, userId }) => {
//   try {
//     console.log('=== SERVICE: confirmarAsiento ===');
//     console.log('Datos:', { viajeId, asientoId, userId });
    
//     if (!viajeId || !asientoId) {
//       return { success: false, message: "Faltan datos: viajeId o asientoId" };
//     }
    
//     const ahora = new Date();

//     // 👈 CORREGIDO: Buscar estado OCUPADO
//     const estadoOcupado = await prisma.estadoviajeasiento.findFirst({
//       where: { 
//         nombre: {
//           equals: 'OCUPADO',  // 👈 Cambiar a 'OCUPADO' mayúsculas
//           mode: 'insensitive'
//         }
//       }
//     });

//     if (!estadoOcupado) {
//       return { success: false, message: "Error: Estado OCUPADO no configurado" };
//     }

//     const registro = await prisma.viaje_asiento.findUnique({
//       where: {
//         viajeId_asientoId: {
//           viajeId,
//           asientoId
//         }
//       }
//     });

//     if (!registro) {
//       return { success: false, message: "Asiento no encontrado" };
//     }

//     // Verificar que la reserva siga válida
//     if (!registro.reservadoHasta || registro.reservadoHasta < ahora) {
//       return { success: false, message: "La reserva expiró" };
//     }

//     const actualizado = await prisma.viaje_asiento.update({
//       where: { id: registro.id },
//       data: {
//         estadoId: estadoOcupado.id,
//         reservadoHasta: null,
//         reservadoPor: userId
//       }
//     });

//     return {
//       success: true,
//       data: actualizado,
//       message: "Compra confirmada"
//     };

//   } catch (error) {
//     console.error('❌ Error en confirmarAsiento:', error);
//     return { success: false, message: error.message };
//   }
// };
// backend/service/viajeAsiento.service.js
// Asegúrate de que esta función exista

const confirmarAsiento = async ({ viajeId, asientoId, userId }) => {
  try {
    const ahora = new Date();

    const registro = await prisma.viaje_asiento.findUnique({
      where: {
        viajeId_asientoId: { viajeId, asientoId }
      }
    });

    if (!registro || !registro.reservaId) {
      return { success: false, message: "No hay reserva asociada" };
    }

    if (!registro.reservadoHasta || registro.reservadoHasta < ahora) {
      return { success: false, message: "La reserva expiró" };
    }

    const estadoOcupado = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: { equals: 'OCUPADO', mode: 'insensitive' } }
    });

    const estadoConfirmado = await prisma.estadoreserva.findFirst({
      where: { nombre: { equals: 'CONFIRMADA', mode: 'insensitive' } }
    });

    if (!estadoOcupado || !estadoConfirmado) {
      return { success: false, message: "Estados no configurados" };
    }

    await prisma.$transaction(async (tx) => {

      await tx.viaje_asiento.update({
        where: { id: registro.id },
        data: {
          estadoId: estadoOcupado.id,
          reservadoHasta: null
        }
      });

      await tx.reserva.update({
        where: { id: registro.reservaId },
        data: {
          estadoId: estadoConfirmado.id
        }
      });

    });

    return { success: true, message: "Compra confirmada" };

  } catch (error) {
    return { success: false, message: error.message };
  }
};

const liberarAsientosVencidos = async () => {
  try {
    console.log('=== SERVICE: liberarAsientosVencidos ===');
    
    const estadoDisponible = await prisma.estadoviajeasiento.findFirst({
      where: { 
        nombre: {
          equals: 'LIBRE',
          mode: 'insensitive'
        }
      }
    });

    const estadoReservado = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: { in: ['RESERVADO', 'Reservado'] } }
    });


    if (!estadoDisponible) {
      console.error('Error: Estado LIBRE no configurado');
      return 0;
    }

    const result = await prisma.viaje_asiento.updateMany({
      where: {
        reservadoHasta: {
          lt: new Date()
        }
      },
      data: {
        estadoId: estadoDisponible.id,
        reservadoHasta: null,
        reservadoPor: null
      }
    });

    console.log(`🔄 ${result.count} asientos liberados`);
    return result.count;

  } catch (error) {
    console.error('❌ Error liberando asientos:', error);
    throw error;
  }
};

const cancelarReserva = async ({ viajeId, asientoId, userId }) => {
  try {
    console.log('=== SERVICE: cancelarReserva ===');
    console.log('Datos:', { viajeId, asientoId, userId });

    if (!viajeId || !asientoId) {
      return { success: false, message: "Faltan datos: viajeId o asientoId" };
    }

    // 🔍 Buscar estado LIBRE
    const estadoDisponible = await prisma.estadoviajeasiento.findFirst({
      where: {
        nombre: {
          equals: 'LIBRE',
          mode: 'insensitive'
        }
      }
    });

    if (!estadoDisponible) {
      return { success: false, message: "Estado LIBRE no configurado" };
    }

    // 🔍 Buscar registro del asiento
    const registro = await prisma.viaje_asiento.findUnique({
      where: {
        viajeId_asientoId: {
          viajeId,
          asientoId
        }
      }
    });

    if (!registro) {
      return { success: false, message: "Asiento no encontrado" };
    }

    const estadoReservado = await prisma.estadoviajeasiento.findFirst({
      where: {
        nombre: {
          in: ['RESERVADO', 'Reservado']
        }
      }
    });

    if (!estadoReservado) {
      return { success: false, message: "Estado RESERVADO no configurado" };
    }






    // 🚫 Validar que el asiento esté reservado
    if (registro.estadoId !== estadoReservado.id) {
      return { success: false, message: "El asiento no está reservado" };
    }
    console.log('Estado actual:', registro.estadoId);

    // 🔒 OPCIONAL: validar que sea del mismo usuario
    if (registro.reservadoPor && registro.reservadoPor !== userId) {
      return { success: false, message: "No puedes cancelar este asiento" };
    }

    // 🔄 Liberar asiento
    const actualizado = await prisma.viaje_asiento.update({
      where: { id: registro.id },
      data: {
        estadoId: estadoDisponible.id,
        reservadoHasta: null,
        reservadoPor: null
      }
    });

    console.log('🪑 Asiento liberado manualmente');

    return {
      success: true,
      data: actualizado,
      message: "Reserva cancelada correctamente"
    };

  } catch (error) {
    console.error('❌ Error en cancelarReserva:', error);
    return { success: false, message: error.message };
  }
};

// backend/service/viajeAsiento.service.js
const cancelarReservasMultiples = async ({ viajeId, asientosIds, userId }) => {
  try {
    console.log('=== SERVICE: cancelarReservasMultiples ===');
    console.log('Datos:', { viajeId, asientosIds, userId });

    if (!viajeId || !asientosIds || asientosIds.length === 0) {
      return { success: false, message: "Faltan datos" };
    }

    // Buscar estado LIBRE y RESERVADO
    const estadoDisponible = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: { equals: 'LIBRE', mode: 'insensitive' } }
    });

    const estadoReservado = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: { in: ['RESERVADO', 'Reservado'] } }
    });

    if (!estadoDisponible || !estadoReservado) {
      return { success: false, message: "Estados no configurados" };
    }

    const resultados = {
      exitosos: [],
      fallidos: []
    };

    // Procesar cada asiento individualmente
    for (const asientoId of asientosIds) {
      try {
        const registro = await prisma.viaje_asiento.findUnique({
          where: {
            viajeId_asientoId: {
              viajeId,
              asientoId: asientoId
            }
          }
        });

        if (!registro) {
          resultados.fallidos.push({ asientoId, motivo: "No encontrado" });
          continue;
        }

        // Validar que esté reservado
        if (registro.estadoId !== estadoReservado.id) {
          resultados.fallidos.push({ asientoId, motivo: "No está reservado" });
          continue;
        }

        // Validar que sea del mismo usuario
        if (registro.reservadoPor && registro.reservadoPor !== userId) {
          resultados.fallidos.push({ asientoId, motivo: "Pertenece a otro usuario" });
          continue;
        }

        // Liberar asiento
        await prisma.viaje_asiento.update({
          where: { id: registro.id },
          data: {
            estadoId: estadoDisponible.id,
            reservadoHasta: null,
            reservadoPor: null
          }
        });

        resultados.exitosos.push(asientoId);
        console.log(`✅ Asiento ${asientoId} liberado`);

      } catch (error) {
        console.error(`❌ Error liberando asiento ${asientoId}:`, error);
        resultados.fallidos.push({ asientoId, motivo: error.message });
      }
    }

    return {
      success: resultados.fallidos.length === 0,
      data: resultados,
      message: resultados.fallidos.length === 0 
        ? "Todos los asientos liberados exitosamente" 
        : `Liberados: ${resultados.exitosos.join(', ')}. Fallidos: ${resultados.fallidos.map(f => f.asientoId).join(', ')}`
    };

  } catch (error) {
    console.error('❌ Error en cancelarReservasMultiples:', error);
    return { success: false, message: error.message };
  }

};

module.exports = {
  reservarAsiento,
  confirmarAsiento,
  comprarAsiento,
  liberarAsientosVencidos,
  cancelarReserva,
  cancelarReservasMultiples
};