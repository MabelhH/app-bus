const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// 🔹 Obtener todos los viajes
const getViajes = async () => {
  try {
    console.log('🚌 Service - Obteniendo viajes');

    const viajes = await prisma.viaje.findMany({
      include: {
        bus: true,
        ruta: true,
        estadoViaje: true
      },
      orderBy: { createdAt: "desc" }
    });

    return {
      success: true,
      data: viajes
    };

  } catch (error) {
    console.error('❌ Error en getViajes:', error);
    return {
      success: false,
      message: error.message
    };
  }
};


// 🔹 Obtener viaje por ID
const getViajeById = async (id) => {
  try {
    console.log('🔍 Service - Buscando viaje:', id);

    const viaje = await prisma.viaje.findUnique({
      where: { id },
      include: {
        bus: true,
        ruta: true,
        estadoViaje: true,
        viaje_asientos: {
          include: {
            asiento: true,
            estado: true
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

    return {
      success: true,
      data: viaje
    };

  } catch (error) {
    console.error('❌ Error en getViajeById:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

const getEstadoDisponibleId = async () => {
  try {
    // Buscar el estado con nombre "Disponible" (exactamente como está en tu BD)
    const estadoDisponible = await prisma.estadoviajeasiento.findFirst({
      where: { 
        nombre: {
          equals: 'Disponible',
          mode: 'insensitive' // Para que no sea sensible a mayúsculas/minúsculas
        }
      }
    });
    
    if (!estadoDisponible) {
      // Si no encuentra "Disponible", buscar el que tenga ID 60221b20-11b5-4e14-8261-...
      // O buscar cualquier estado con nombre que contenga "disponible"
      const estadoAlternativo = await prisma.estadoviajeasiento.findFirst({
        where: {
          nombre: {
            contains: 'Disponible',
            mode: 'insensitive'
          }
        }
      });
      
      if (!estadoAlternativo) {
        throw new Error('No se encontró el estado Disponible para los asientos');
      }
      return estadoAlternativo.id;
    }
    
    return estadoDisponible.id;
  } catch (error) {
    console.error('Error al obtener estado Disponible:', error);
    throw error;
  }
};

// 🔹 Crear viaje + generar asientos automáticamente
const createViaje = async (data) => {
  try {
    console.log('📝 Service - Creando viaje:', data);

    const { fecha, hora, busId, rutaId, idEstadoViaje } = data;

    // ✅ Validaciones
    if (!fecha || !hora || !busId || !rutaId || !idEstadoViaje) {
      return {
        success: false,
        message: "Todos los campos son obligatorios"
      };
    }

    // 🔍 Validar bus
    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: { 
        asientos: {
          orderBy: {
            numeroAsiento: 'asc'
          }
        }
      }
    });

    if (!bus) {
      return {
        success: false,
        message: "El bus no existe"
      };
    }

    console.log(`✅ Bus encontrado: ${bus.placa} (Capacidad: ${bus.capacidad})`);
    console.log(`✅ Asientos del bus: ${bus.asientos.length}`);

    // ✅ Verificar que el bus tenga asientos
    if (bus.asientos.length === 0) {
      return {
        success: false,
        message: `El bus ${bus.placa} no tiene asientos registrados. Por favor, verifica la creación del bus.`
      };
    }

    // 🔍 Validar ruta
    const ruta = await prisma.ruta.findUnique({
      where: { id: rutaId }
    });

    if (!ruta) {
      return {
        success: false,
        message: "La ruta no existe"
      };
    }

    // 🔍 Validar estado del viaje
    const estadoViaje = await prisma.estadoviaje.findUnique({
      where: { id: idEstadoViaje }
    });

    if (!estadoViaje) {
      return {
        success: false,
        message: "El estado del viaje no existe"
      };
    }

    // 🔥 OBTENER EL ID DEL ESTADO "DISPONIBLE" DE FORMA DINÁMICA
    console.log('🔍 Buscando estado "Disponible" en estadoviajeasiento...');
    
    let estadoDisponible = await prisma.estadoviajeasiento.findFirst({
      where: {
        OR: [
          { nombre: { equals: 'Disponible', mode: 'insensitive' } },
          { nombre: { equals: 'DISPONIBLE', mode: 'insensitive' } },
          { nombre: { equals: 'disponible', mode: 'insensitive' } },
          { nombre: { contains: 'disponible', mode: 'insensitive' } }
        ]
      }
    });

    // Si no encuentra por nombre, intenta con el ID que viste en tu base de datos
    if (!estadoDisponible) {
      console.log('⚠️ No se encontró por nombre, buscando por ID específico...');
      
      // Lista de posibles IDs de tu base de datos (según tu imagen)
      const posiblesIds = [
        "60221b20-11b5-4e14-8261-", // Reemplaza con el ID completo de tu imagen
        // Agrega otros IDs si es necesario
      ];
      
      for (const id of posiblesIds) {
        const estado = await prisma.estadoviajeasiento.findUnique({
          where: { id: id }
        });
        if (estado) {
          estadoDisponible = estado;
          break;
        }
      }
    }

    // Si aún no encuentra, lista todos los estados disponibles
    if (!estadoDisponible) {
      const todosLosEstados = await prisma.estadoviajeasiento.findMany();
      console.log('📋 Todos los estados disponibles:', todosLosEstados);
      
      // Buscar cualquiera que tenga "Disponible" en el nombre
      estadoDisponible = todosLosEstados.find(e => 
        e.nombre.toLowerCase().includes('disponible') ||
        e.nombre.toLowerCase().includes('libre')
      );
    }

    if (!estadoDisponible) {
      return {
        success: false,
        message: "No se encontró el estado 'Disponible' para los asientos. Los estados disponibles son: " + 
                 (await prisma.estadoviajeasiento.findMany()).map(e => e.nombre).join(', ')
      };
    }

    console.log(`✅ Estado Disponible encontrado: ${estadoDisponible.nombre} (ID: ${estadoDisponible.id})`);

    // ✅ Crear viaje
    const viaje = await prisma.viaje.create({
      data: {
        fecha: new Date(fecha),
        hora,
        busId,
        rutaId,
        idEstadoViaje
      }
    });

    console.log(`✅ Viaje creado con ID: ${viaje.id}`);

    // 🔥 CREAR ASIENTOS DEL VIAJE AUTOMÁTICAMENTE con el ID correcto
    const asientosViaje = bus.asientos.map(asiento => ({
      viajeId: viaje.id,
      asientoId: asiento.id,
      estadoId: estadoDisponible.id // ✅ Usar el ID real encontrado
    }));

    console.log(`📝 Creando ${asientosViaje.length} registros en viaje_asiento...`);

    const result = await prisma.viaje_asiento.createMany({
      data: asientosViaje,
      skipDuplicates: true
    });

    console.log(`✅ Creados ${result.count} registros en viaje_asiento`);

    // ✅ Obtener el viaje completo con sus relaciones
    const viajeCompleto = await prisma.viaje.findUnique({
      where: { id: viaje.id },
      include: {
        bus: {
          include: {
            marca: true,
            estado: true
          }
        },
        ruta: true,
        estadoViaje: true,
        viaje_asientos: {
          include: {
            asiento: true,
            estado: true
          },
          orderBy: {
            asiento: {
              numeroAsiento: 'asc'
            }
          }
        }
      }
    });

    return {
      success: true,
      data: viajeCompleto,
      message: `Viaje creado exitosamente con ${result.count} asientos`
    };

  } catch (error) {
    console.error('❌ Error en createViaje:', error);
    return {
      success: false,
      message: error.message || "Error al crear el viaje"
    };
  }
};


// 🔹 Actualizar viaje
const updateViaje = async (id, data) => {
  try {
    console.log('📝 Service - Actualizando viaje:', id);
    console.log('📦 Datos a actualizar:', data);

    // 🔍 Obtener el viaje existente con su estado
    const existingViaje = await prisma.viaje.findUnique({
      where: { id },
      include: {
        estadoViaje: true
      }
    });

    if (!existingViaje) {
      return {
        success: false,
        message: "Viaje no encontrado"
      };
    }

    console.log(`✅ Estado actual del viaje: ${existingViaje.estadoViaje.nombre}`);

    // 🔒 VERIFICAR SI EL ESTADO ES "INICIADO" - NO PERMITIR CAMBIAR LA RUTA
    if (existingViaje.estadoViaje.nombre === 'INICIADO') {
      // Si se intenta cambiar la ruta
      if (data.rutaId && data.rutaId !== existingViaje.rutaId) {
        return {
          success: false,
          message: "No se puede modificar la ruta de un viaje que ya está INICIADO"
        };
      }
    }

    // 🔒 VERIFICAR SI EL ESTADO ES "FINALIZADO" - NO PERMITIR NINGUNA EDICIÓN
    if (existingViaje.estadoViaje.nombre === 'FINALIZADO') {
      return {
        success: false,
        message: "No se puede editar un viaje que ya está FINALIZADO"
      };
    }

    // 📝 Preparar los datos para actualizar
    const updateData = {};
    
    // Permitir actualizar fecha
    if (data.fecha !== undefined) {
      updateData.fecha = new Date(data.fecha);
    }
    
    // Permitir actualizar hora
    if (data.hora !== undefined) {
      updateData.hora = data.hora;
    }
    
    // Permitir actualizar bus
    if (data.busId !== undefined) {
      updateData.busId = data.busId;
    }
    
    // Permitir actualizar ruta (solo si no está bloqueado)
    if (data.rutaId !== undefined) {
      updateData.rutaId = data.rutaId;
    }
    
    // Permitir actualizar estado
    if (data.idEstadoViaje !== undefined) {
      updateData.idEstadoViaje = data.idEstadoViaje;
    }

    // Actualizar el viaje
    const viaje = await prisma.viaje.update({
      where: { id },
      data: updateData,
      include: {
        bus: {
          include: {
            marca: true,
            estado: true
          }
        },
        ruta: true,
        estadoViaje: true
      }
    });

    return {
      success: true,
      data: viaje,
      message: "Viaje actualizado exitosamente"
    };

  } catch (error) {
    console.error('❌ Error en updateViaje:', error);
    return {
      success: false,
      message: error.message || "Error al actualizar el viaje"
    };
  }
};


// 🔹 Eliminar viaje
const deleteViaje = async (id) => {
  try {
    console.log('🗑️ Service - Eliminando viaje:', id);

    const existingViaje = await prisma.viaje.findUnique({
      where: { id },
      include: {
        reservas: true
      }
    });

    if (!existingViaje) {
      return {
        success: false,
        message: "Viaje no encontrado"
      };
    }

    if (existingViaje.reservas.length > 0) {
      return {
        success: false,
        message: "No se puede eliminar el viaje porque tiene reservas"
      };
    }

    // Eliminar asientos del viaje primero
    await prisma.viaje_asiento.deleteMany({
      where: { viajeId: id }
    });

    // Eliminar viaje
    await prisma.viaje.delete({
      where: { id }
    });

    return {
      success: true,
      message: "Viaje eliminado correctamente"
    };

  } catch (error) {
    console.error('❌ Error en deleteViaje:', error);
    return {
      success: false,
      message: error.message
    };
  }
};


module.exports = {
  getViajes,
  getViajeById,
  createViaje,
  updateViaje,
  deleteViaje
};