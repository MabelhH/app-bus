const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const trackingService = require('../service/tracking.service');

// Obtener todos los buses
const getBus = async () => {
  try {
    const buses = await prisma.bus.findMany({
      include: {
        marca: {
          select: {
            id: true,
            nombre: true
          }
        },
        estado: {
          select: {
            id: true,
            nombre: true
          }
        },
        asientos: true
      },
      orderBy: { createdAt: "desc" }
    });

    const busesConConteo = buses.map(bus => ({
      ...bus,
      totalAsientos: bus.asientos.length
    }));
    
    return {
      success: true,
      data: busesConConteo
    };
  } catch (error) {
    console.error('Error en getBus:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Obtener bus por ID
const getBusById = async (id) => {
  try {
    const bus = await prisma.bus.findUnique({
      where: { id },
      include: {
        marca: {
          select: {
            id: true,
            nombre: true
          }
        },
        estado: {
          select: {
            id: true,
            nombre: true
          }
        },
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
        message: "Bus no encontrado"
      };
    }

    return {
      success: true,
      data: bus
    };
  } catch (error) {
    console.error('Error en getBusById:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Crear bus
const createBus = async (data) => {
  try {
    console.log('📥 Datos recibidos en createBus:', data);

    // Validar campos requeridos - AHORA USA marcaId
    if (!data.placa || !data.marcaId || !data.modelo || !data.capacidad || !data.estadoId) {
      return {
        success: false,
        message: "Todos los campos son obligatorios: placa, marcaId, modelo, capacidad, estadoId"
      };
    }

    // Verificar que la marca existe
    const marcaExists = await prisma.marca.findUnique({
      where: { id: String(data.marcaId) }
    });

    if (!marcaExists) {
      return {
        success: false,
        message: "La marca especificada no existe"
      };
    }

    // Verificar que el estado existe
    const estadoExists = await prisma.estadobus.findUnique({
      where: { id: String(data.estadoId) }
    });

    if (!estadoExists) {
      return {
        success: false,
        message: "El estado especificado no existe"
      };
    }

    // Verificar si la placa ya existe
    const existingBus = await prisma.bus.findUnique({
      where: { placa: data.placa.toUpperCase() }
    });

    if (existingBus) {
      return {
        success: false,
        message: "Ya existe un bus con esa placa"
      };
    }

    // Crear el bus CON marcaId
    const bus = await prisma.bus.create({
      data: {
        placa: data.placa.toUpperCase(),
        marcaId: String(data.marcaId),
        modelo: data.modelo,
        capacidad: parseInt(data.capacidad),
        estadoId: String(data.estadoId)
      },
      include: {
        marca: {
          select: {
            id: true,
            nombre: true
          }
        },
        estado: {
          select: {
            id: true,
            nombre: true
          }
        }
      }
    });

    const asientos = [];

    for (let i = 1; i <= bus.capacidad; i++) {
      asientos.push({
        numeroAsiento: i,
        busId: bus.id
      });
    }

    await prisma.asiento.createMany({
      data: asientos
    });


    return {
      success: true,
      data: bus,
      message: "Bus creado correctamente"
    };
  } catch (error) {
    console.error('❌ Error en createBus:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Actualizar bus
const updateBus = async (id, data) => {
  try {
    console.log('📥 Actualizando bus:', id, data);

    // Verificar si el bus existe
    const existingBus = await prisma.bus.findUnique({
      where: { id },
      include: {
        asientos: true
      }
    });

    if (!existingBus) {
      return {
        success: false,
        message: "Bus no encontrado"
      };
    }

    const updateData = {};

    // Validar y actualizar placa
    if (data.placa) {
      if (data.placa !== existingBus.placa) {
        const busWithSamePlaca = await prisma.bus.findUnique({
          where: { placa: data.placa.toUpperCase() }
        });

        if (busWithSamePlaca) {
          return {
            success: false,
            message: "Ya existe otro bus con esa placa"
          };
        }
      }
      updateData.placa = data.placa.toUpperCase();
    }

    // Validar y actualizar marcaId
    if (data.marcaId) {
      const marcaExists = await prisma.marca.findUnique({
        where: { id: String(data.marcaId) }
      });

      if (!marcaExists) {
        return {
          success: false,
          message: "La marca especificada no existe"
        };
      }
      updateData.marcaId = String(data.marcaId);
    }

    // Actualizar otros campos
    if (data.modelo) updateData.modelo = data.modelo;
    
    // Manejar capacidad
    if (data.capacidad) {
      const nuevaCapacidad = parseInt(data.capacidad);
      
      // Si la capacidad aumentó, crear nuevos asientos
      if (nuevaCapacidad > existingBus.capacidad) {
        const nuevosAsientos = [];
        for (let i = existingBus.capacidad + 1; i <= nuevaCapacidad; i++) {
          nuevosAsientos.push({
            numeroAsiento: i,
            busId: id,
            estado: 'DISPONIBLE'
          });
        }
        
        if (nuevosAsientos.length > 0) {
          await prisma.asiento.createMany({
            data: nuevosAsientos
          });
        }
      }
      
      updateData.capacidad = nuevaCapacidad;
    }

    // Manejar estado
    if (data.estadoId) {
      const estadoExists = await prisma.estadobus.findUnique({
        where: { id: String(data.estadoId) }
      });

      if (!estadoExists) {
        return {
          success: false,
          message: "El estado especificado no existe"
        };
      }

      updateData.estadoId = String(data.estadoId);
    }

    // Actualizar el bus
    const bus = await prisma.bus.update({
      where: { id },
      data: updateData,
      include: {
        marca: {
          select: {
            id: true,
            nombre: true
          }
        },
        estado: {
          select: {
            id: true,
            nombre: true
          }
        },
        asientos: true
      }
    });

    console.log('✅ Bus actualizado:', bus);

    return {
      success: true,
      data: bus,
      message: "Bus actualizado correctamente"
    };
  } catch (error) {
    console.error('❌ Error en updateBus:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Eliminar bus
const deleteBus = async (id) => {
  try {
    console.log('📥 Eliminando bus:', id);

    // Verificar si el bus existe y obtener relaciones
    const existingBus = await prisma.bus.findUnique({
      where: { id },
      include: {
        viajes: true,
        ocurrencias: true,
        asientos: true
      }
    });

    if (!existingBus) {
      return {
        success: false,
        message: "Bus no encontrado"
      };
    }

    // Verificar si tiene viajes programados
    if (existingBus.viajes && existingBus.viajes.length > 0) {
      return {
        success: false,
        message: "No se puede eliminar el bus porque tiene viajes asociados"
      };
    }

    // Verificar si tiene ocurrencias
    if (existingBus.ocurrencias && existingBus.ocurrencias.length > 0) {
      return {
        success: false,
        message: "No se puede eliminar el bus porque tiene ocurrencias asociadas"
      };
    }

    // Eliminar asientos primero
    if (existingBus.asientos && existingBus.asientos.length > 0) {
      await prisma.asiento.deleteMany({
        where: { busId: id }
      });
    }

    // Eliminar el bus
    await prisma.bus.delete({
      where: { id }
    });

    console.log('✅ Bus eliminado correctamente');

    return {
      success: true,
      message: "Bus eliminado correctamente"
    };
  } catch (error) {
    console.error('❌ Error en deleteBus:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// ========== TRACKING ==========

// Reportar ubicación de un bus (POST /ubicacion)
const reportarUbicacion = async (req, res) => {
  try {
    const { busId, lat, lng, speed, viajeId } = req.body;
    if (!busId || lat === undefined || lng === undefined) {
      return res.status(400).json({ error: 'Faltan campos: busId, lat, lng' });
    }
    const resultado = await trackingService.saveLocation(
      busId,
      parseFloat(lat),
      parseFloat(lng),
      speed || 0,
      viajeId || null
    );
    res.status(201).json({ success: true, data: resultado });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener última ubicación de un bus (GET /ubicacion/:busId)
const obtenerUltimaUbicacion = async (req, res) => {
  try {
    const { busId } = req.params;
    const ubicacion = await trackingService.getLastLocation(busId);
    if (!ubicacion) {
      return res.status(404).json({ success: false, message: 'No hay ubicaciones registradas' });
    }
    res.json({ success: true, data: ubicacion });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener todos los buses activos (GET /activos)
const obtenerBusesActivos = async (req, res) => {
  try {
    const buses = await trackingService.getActiveBuses(5); // últimos 5 min
    res.json({ success: true, data: buses });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Obtener historial de ubicaciones de un bus (GET /historial/:busId)
const obtenerHistorialUbicaciones = async (req, res) => {
  try {
    const { busId } = req.params;
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 100;
    const historial = await trackingService.getLocationHistory(busId, hours, limit);
    res.json({ success: true, data: historial });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getBus,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  reportarUbicacion,
  obtenerUltimaUbicacion,
  obtenerBusesActivos,
  obtenerHistorialUbicaciones
};