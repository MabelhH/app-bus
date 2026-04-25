// service/asientos.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los asientos
const getAsientos = async () => {
  try {
    const asientos = await prisma.asiento.findMany({
      include: {
        bus: {
          select: {
            id: true,
            placa: true,
            modelo: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: asientos
    };
  } catch (error) {
    console.error('Error en getAsientos:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

const getAsientosByBus = async (busId, viajeId = null) => {
  try {
    console.log('🔍 Buscando asientos para bus:', busId);
    console.log('📌 viajeId:', viajeId);
    
    // Verificar si el bus existe
    const busExists = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!busExists) {
      return {
        success: false,
        message: "El bus no existe"
      };
    }

    // Obtener todos los asientos del bus
    const asientos = await prisma.asiento.findMany({
      where: { busId },
      include: {
        bus: {
          select: {
            id: true,
            placa: true,
            modelo: true
          }
        }
      },
      orderBy: {
        numeroAsiento: 'asc'
      }
    });

    // Si se proporciona viajeId, obtener el estado de los asientos para ese viaje
    let asientosConEstado = [];
    
    if (viajeId) {
      // Obtener los registros de viaje_asiento para este viaje
      const viajeAsientos = await prisma.viaje_asiento.findMany({
        where: { viajeId },
        include: {
          estado: true
        }
      });
      
      // Crear un mapa para búsqueda rápida
      const estadoMap = new Map();
      viajeAsientos.forEach(va => {
        estadoMap.set(va.asientoId, {
          estadoId: va.estadoId,
          estadoNombre: va.estado?.nombre || 'DISPONIBLE',
          reservadoHasta: va.reservadoHasta || null
        });
      });

      // Combinar la información
      asientosConEstado = asientos.map(asiento => ({
        id: asiento.id,
        numeroAsiento: asiento.numeroAsiento,
        busId: asiento.busId,
        bus: asiento.bus,
        estado: estadoMap.get(asiento.id)?.estadoNombre || 'DISPONIBLE',
        estadoId: estadoMap.get(asiento.id)?.estadoId || null,
        reservadoHasta: estadoMap.get(asiento.id)?.reservadoHasta || null
      }));
      
      console.log('📊 Asientos con estado:', asientosConEstado.map(a => ({ numero: a.numeroAsiento, estado: a.estado })));
    } else {
      // Si no hay viajeId, todos están disponibles
      asientosConEstado = asientos.map(asiento => ({
        id: asiento.id,
        numeroAsiento: asiento.numeroAsiento,
        busId: asiento.busId,
        bus: asiento.bus,
        estado: 'DISPONIBLE',
        estadoId: null
      }));
    }

    return {
      success: true,
      data: asientosConEstado,
      total: asientosConEstado.length,
      message: "Asientos obtenidos correctamente"
    };
  } catch (error) {
    console.error('❌ Error en getAsientosByBus:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Obtener asiento por ID
const getAsientoById = async (id) => {
  try {
    const asiento = await prisma.asiento.findUnique({
      where: { id },
      include: {
        bus: {
          select: {
            id: true,
            placa: true,
            modelo: true,
            capacidad: true
          }
        }
      }
    });

    if (!asiento) {
      return {
        success: false,
        message: "Asiento no encontrado"
      };
    }

    return {
      success: true,
      data: asiento
    };
  } catch (error) {
    console.error('Error en getAsientoById:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Crear asiento individual
const createAsiento = async (data) => {
  try {
    console.log('📥 Datos recibidos en createAsiento:', data);

    // Validar campos requeridos
    if (!data.numeroAsiento || !data.busId) {
      return {
        success: false,
        message: "Número de asiento y bus son obligatorios"
      };
    }

    // Verificar que el bus existe
    const busExists = await prisma.bus.findUnique({
      where: { id: data.busId },
      include: { asientos: true }
    });

    if (!busExists) {
      return {
        success: false,
        message: "El bus especificado no existe"
      };
    }

    // Verificar que el número de asiento no exceda la capacidad del bus
    if (data.numeroAsiento > busExists.capacidad) {
      return {
        success: false,
        message: `El número de asiento no puede exceder la capacidad del bus (${busExists.capacidad})`
      };
    }

    // Verificar que no exista un asiento con el mismo número en el mismo bus
    const existingAsiento = await prisma.asiento.findFirst({
      where: {
        busId: data.busId,
        numeroAsiento: data.numeroAsiento
      }
    });

    if (existingAsiento) {
      return {
        success: false,
        message: `Ya existe un asiento con el número ${data.numeroAsiento} en este bus`
      };
    }

    // Crear el asiento
    const asiento = await prisma.asiento.create({
      data: {
        numeroAsiento: data.numeroAsiento,
        busId: data.busId,
        estado: data.estado || "Disponible"
      },
      include: {
        bus: {
          select: {
            id: true,
            placa: true,
            modelo: true
          }
        }
      }
    });

    return {
      success: true,
      data: asiento,
      message: "Asiento creado correctamente"
    };
  } catch (error) {
    console.error('❌ Error en createAsiento:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Crear múltiples asientos
const createMultipleAsientos = async (data) => {
  try {
    console.log('📥 Creando múltiples asientos:', data);

    const { busId, asientos } = data;

    if (!busId || !asientos || !Array.isArray(asientos) || asientos.length === 0) {
      return {
        success: false,
        message: "Se requiere busId y un array de números de asiento"
      };
    }

    // Verificar que el bus existe
    const busExists = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!busExists) {
      return {
        success: false,
        message: "El bus especificado no existe"
      };
    }

    // Obtener asientos existentes para evitar duplicados
    const existingAsientos = await prisma.asiento.findMany({
      where: { busId },
      select: { numeroAsiento: true }
    });

    const existingNumbers = existingAsientos.map(a => a.numeroAsiento);
    
    // Filtrar asientos que no existen
    const nuevosAsientos = asientos
      .filter(numero => !existingNumbers.includes(numero))
      .map(numero => ({
        numeroAsiento: numero,
        busId
      }));

    if (nuevosAsientos.length === 0) {
      return {
        success: false,
        message: "Todos los asientos ya existen en este bus"
      };
    }

    // Verificar que no excedan la capacidad
    const totalAsientosDespues = existingAsientos.length + nuevosAsientos.length;
    if (totalAsientosDespues > busExists.capacidad) {
      return {
        success: false,
        message: `No se pueden agregar ${nuevosAsientos.length} asientos. La capacidad máxima es ${busExists.capacidad} y ya existen ${existingAsientos.length} asientos`
      };
    }

    // Crear los nuevos asientos
    const createdAsientos = await prisma.asiento.createMany({
      data: nuevosAsientos
    });

    return {
      success: true,
      data: {
        creados: createdAsientos.count,
        totalSolicitados: asientos.length,
        yaExistian: asientos.length - nuevosAsientos.length
      },
      message: `${createdAsientos.count} asientos creados correctamente`
    };
  } catch (error) {
    console.error('❌ Error en createMultipleAsientos:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Actualizar asiento
const updateAsiento = async (id, data) => {
  try {
    console.log('📥 Actualizando asiento:', id, data);

    // Verificar si el asiento existe
    const existingAsiento = await prisma.asiento.findUnique({
      where: { id },
      include: { bus: true }
    });

    if (!existingAsiento) {
      return {
        success: false,
        message: "Asiento no encontrado"
      };
    }

    if (data.estado) {
      updateData.estado = data.estado;
    }

    const updateData = {};

    // Validar y actualizar número de asiento
    if (data.numeroAsiento) {
      // Verificar que no exceda la capacidad del bus
      if (data.numeroAsiento > existingAsiento.bus.capacidad) {
        return {
          success: false,
          message: `El número de asiento no puede exceder la capacidad del bus (${existingAsiento.bus.capacidad})`
        };
      }

      // Verificar que no exista otro asiento con el mismo número en el mismo bus
      const asientoExists = await prisma.asiento.findFirst({
        where: {
          busId: existingAsiento.busId,
          numeroAsiento: data.numeroAsiento,
          NOT: { id }
        }
      });

      if (asientoExists) {
        return {
          success: false,
          message: `Ya existe un asiento con el número ${data.numeroAsiento} en este bus`
        };
      }

      updateData.numeroAsiento = data.numeroAsiento;
    }

    // Actualizar busId si se proporciona
    if (data.busId) {
      // Verificar que el nuevo bus existe
      const newBusExists = await prisma.bus.findUnique({
        where: { id: data.busId },
        include: { asientos: true }
      });

      if (!newBusExists) {
        return {
          success: false,
          message: "El bus especificado no existe"
        };
      }

      // Verificar que el número de asiento no exceda la capacidad del nuevo bus
      const numeroAsiento = data.numeroAsiento || existingAsiento.numeroAsiento;
      if (numeroAsiento > newBusExists.capacidad) {
        return {
          success: false,
          message: `El número de asiento (${numeroAsiento}) excede la capacidad del nuevo bus (${newBusExists.capacidad})`
        };
      }

      // Verificar que no exista un asiento con el mismo número en el nuevo bus
      const asientoEnNuevoBus = await prisma.asiento.findFirst({
        where: {
          busId: data.busId,
          numeroAsiento: numeroAsiento,
          NOT: { id }
        }
      });

      if (asientoEnNuevoBus) {
        return {
          success: false,
          message: `Ya existe un asiento con el número ${numeroAsiento} en el bus destino`
        };
      }

      updateData.busId = data.busId;
    }

    // Actualizar el asiento
    const asiento = await prisma.asiento.update({
      where: { id },
      data: updateData,
      include: {
        bus: {
          select: {
            id: true,
            placa: true,
            modelo: true
          }
        }
      }
    });

    console.log('✅ Asiento actualizado:', asiento);

    return {
      success: true,
      data: asiento,
      message: "Asiento actualizado correctamente"
    };
  } catch (error) {
    console.error('❌ Error en updateAsiento:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Eliminar asiento
const deleteAsiento = async (id) => {
  try {
    console.log('📥 Eliminando asiento:', id);

    // Verificar si el asiento existe y obtener sus relaciones
    const existingAsiento = await prisma.asiento.findUnique({
      where: { id },
      include: {
        tickets: true,
        reservas: true
      }
    });

    if (!existingAsiento) {
      return {
        success: false,
        message: "Asiento no encontrado"
      };
    }

    // Verificar si tiene tickets asociados
    if (existingAsiento.tickets && existingAsiento.tickets.length > 0) {
      return {
        success: false,
        message: "No se puede eliminar el asiento porque tiene tickets asociados"
      };
    }

    // Verificar si tiene reservas asociadas
    if (existingAsiento.reservas && existingAsiento.reservas.length > 0) {
      return {
        success: false,
        message: "No se puede eliminar el asiento porque tiene reservas asociadas"
      };
    }

    // Eliminar el asiento
    await prisma.asiento.delete({
      where: { id }
    });

    console.log('✅ Asiento eliminado correctamente');

    return {
      success: true,
      message: "Asiento eliminado correctamente"
    };
  } catch (error) {
    console.error('❌ Error en deleteAsiento:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Eliminar todos los asientos de un bus
const deleteAsientosByBus = async (busId) => {
  try {
    console.log('📥 Eliminando todos los asientos del bus:', busId);

    // Verificar si el bus existe
    const busExists = await prisma.bus.findUnique({
      where: { id: busId }
    });

    if (!busExists) {
      return {
        success: false,
        message: "El bus no existe"
      };
    }

    // Verificar si hay asientos con tickets o reservas
    const asientos = await prisma.asiento.findMany({
      where: { busId },
      include: {
        tickets: true,
        reservas: true
      }
    });

    const asientosConRelaciones = asientos.filter(
      asiento => (asiento.tickets && asiento.tickets.length > 0) || 
                 (asiento.reservas && asiento.reservas.length > 0)
    );

    if (asientosConRelaciones.length > 0) {
      return {
        success: false,
        message: `No se pueden eliminar los asientos porque ${asientosConRelaciones.length} de ellos tienen tickets o reservas asociadas`
      };
    }

    // Eliminar todos los asientos del bus
    const deleted = await prisma.asiento.deleteMany({
      where: { busId }
    });

    console.log(`✅ ${deleted.count} asientos eliminados del bus ${busId}`);

    return {
      success: true,
      data: {
        eliminados: deleted.count
      },
      message: `${deleted.count} asientos eliminados correctamente`
    };
  } catch (error) {
    console.error('❌ Error en deleteAsientosByBus:', error);
    return {
      success: false,
      message: error.message
    };
  }
};


const agregarAsientosABus = async (busId, nuevaCapacidad) => {
  try {
    console.log('📥 Agregando asientos al bus:', busId);
    console.log('📌 Nueva capacidad solicitada:', nuevaCapacidad);

    // Verificar si el bus existe
    const busExists = await prisma.bus.findUnique({
      where: { id: busId },
      include: { asientos: true }
    });

    if (!busExists) {
      return {
        success: false,
        message: "El bus no existe"
      };
    }
    // Validar que la nueva capacidad sea mayor que la actual
    if (nuevaCapacidad <= busExists.capacidad) {
      return {
        success: false,
        message: `La nueva capacidad (${nuevaCapacidad}) debe ser mayor que la capacidad actual (${busExists.capacidad})`
      };
    }

    // Obtener los números de asiento que ya existen
    const asientosExistentes = busExists.asientos;
    const numerosExistentes = asientosExistentes.map(a => a.numeroAsiento);
    const nuevosNumeros = [];
    for (let i = 1; i <= nuevaCapacidad; i++) {
      if (!numerosExistentes.includes(i)) {
        nuevosNumeros.push(i);
      }
    }

    if (nuevosNumeros.length === 0) {
      return {
        success: false,
        message: "Todos los asientos ya existen"
      };
    }

    console.log(`📊 Se agregarán ${nuevosNumeros.length} nuevos asientos:`, nuevosNumeros);

     const nuevosAsientos = await prisma.asiento.createMany({
      data: nuevosNumeros.map(numero => ({
        numeroAsiento: numero,
        busId: busId,
        estado: "Disponible"
      }))
    });

    // Actualizar la capacidad del bus
    const busActualizado = await prisma.bus.update({
      where: { id: busId },
      data: { capacidad: nuevaCapacidad }
    });

    console.log(`✅ Bus actualizado: capacidad ${busExists.capacidad} → ${nuevaCapacidad}`);
    console.log(`✅ ${nuevosAsientos.count} asientos agregados`);

    return {
      success: true,
      data: {
        busId,
        capacidadAnterior: busExists.capacidad,
        capacidadNueva: nuevaCapacidad,
        asientosAgregados: nuevosAsientos.count,
        numerosAgregados: nuevosNumeros
      },
      message: `${nuevosAsientos.count} asientos agregados exitosamente. Nueva capacidad: ${nuevaCapacidad}`
    };
  } catch (error) {
    console.error('❌ Error en agregarAsientosABus:', error);
    return {
      success: false,
      message: error.message
    };
  } 
};

// NUEVA FUNCIÓN: Obtener asientos con estado detallado para un viaje
const getAsientosConEstadoParaViaje = async (viajeId) => {
  try {
    console.log('🔍 Obteniendo asientos con estado para viaje:', viajeId);

    // Obtener el viaje con su bus
    const viaje = await prisma.viaje.findUnique({
      where: { id: viajeId },
      include: {
        bus: {
          include: {
            asientos: true
          }
        }
      }
    });

    if (!viaje) {
      return {
        success: false,
        message: "Viaje no encontrado"
      };
    }

    // Obtener todos los viaje_asiento para este viaje
    const viajeAsientos = await prisma.viaje_asiento.findMany({
      where: { viajeId },
      include: {
        estado: true,
        asiento: true
      }
    });

    // Crear un mapa de estados por asiento
    const estadoMap = new Map();
    viajeAsientos.forEach(va => {
      estadoMap.set(va.asientoId, {
        estado: va.estado?.nombre || 'DISPONIBLE',
        estadoId: va.estadoId,
        reservadoPor: va.reservadoPor,
        reservadoHasta: va.reservadoHasta
      });
    });

    // Combinar todos los asientos del bus con sus estados
    const asientosConEstado = viaje.bus.asientos.map(asiento => {
      const estadoInfo = estadoMap.get(asiento.id);
      return {
        id: asiento.id,
        numeroAsiento: asiento.numeroAsiento,
        busId: asiento.busId,
        estado: estadoInfo?.estado || 'DISPONIBLE',
        estadoId: estadoInfo?.estadoId || null,
        reservadoPor: estadoInfo?.reservadoPor || null,
        reservadoHasta: estadoInfo?.reservadoHasta || null
      };
    });

    console.log('📊 Asientos con estado:', asientosConEstado.map(a => ({ 
      numero: a.numeroAsiento, 
      estado: a.estado,
      reservadoPor: a.reservadoPor 
    })));

    return {
      success: true,
      data: asientosConEstado.sort((a, b) => a.numeroAsiento - b.numeroAsiento),
      total: asientosConEstado.length
    };
  } catch (error) {
    console.error('❌ Error en getAsientosConEstadoParaViaje:', error);
    return {
      success: false,
      message: error.message,
      data: []
    };
  }
};

// NUEVA FUNCIÓN: Actualizar capacidad del bus y crear asientos faltantes automáticamente
const actualizarCapacidadBus = async (busId, nuevaCapacidad) => {
  try {
    console.log('📥 Actualizando capacidad del bus:', busId, 'a', nuevaCapacidad);

    // Verificar si el bus existe
    const busExists = await prisma.bus.findUnique({
      where: { id: busId },
      include: { asientos: true }
    });

    if (!busExists) {
      return {
        success: false,
        message: "El bus no existe"
      };
    }

    if (nuevaCapacidad < busExists.capacidad) {
      return {
        success: false,
        message: `No se puede reducir la capacidad de ${busExists.capacidad} a ${nuevaCapacidad}. Solo se permite aumentar la capacidad.`
      };
    }

    if (nuevaCapacidad === busExists.capacidad) {
      return {
        success: false,
        message: "La capacidad ya es la misma"
      };
    }

    // Obtener números de asiento existentes
    const numerosExistentes = busExists.asientos.map(a => a.numeroAsiento);
    
    // Crear asientos faltantes
    const asientosFaltantes = [];
    for (let i = 1; i <= nuevaCapacidad; i++) {
      if (!numerosExistentes.includes(i)) {
        asientosFaltantes.push({
          numeroAsiento: i,
          busId: busId,
          estado: "Disponible"
        });
      }
    }

    let asientosCreados = 0;
    if (asientosFaltantes.length > 0) {
      const result = await prisma.asiento.createMany({
        data: asientosFaltantes
      });
      asientosCreados = result.count;
    }

    // Actualizar capacidad del bus
    const busActualizado = await prisma.bus.update({
      where: { id: busId },
      data: { capacidad: nuevaCapacidad }
    });

    return {
      success: true,
      data: {
        busId,
        capacidadAnterior: busExists.capacidad,
        capacidadNueva: nuevaCapacidad,
        asientosCreados,
        asientosTotales: busExists.asientos.length + asientosCreados
      },
      message: `Capacidad actualizada de ${busExists.capacidad} a ${nuevaCapacidad}. Se crearon ${asientosCreados} asientos nuevos.`
    };
  } catch (error) {
    console.error('❌ Error en actualizarCapacidadBus:', error);
    return {
      success: false,
      message: error.message
    };
  }
};


module.exports = {
  getAsientos,
  getAsientosByBus,
  getAsientoById,
  createAsiento,
  createMultipleAsientos,
  updateAsiento,
  deleteAsiento,
  deleteAsientosByBus,
  agregarAsientosABus,
  getAsientosConEstadoParaViaje,
  actualizarCapacidadBus
};