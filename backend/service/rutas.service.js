const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


// 🔹 Obtener todas las rutas
const getRutas = async () => {
  try {
    console.log('🔍 Service - Obteniendo todas las rutas');

    const rutas = await prisma.ruta.findMany({
      where: { estado: true },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { viajes: true }
        }
      }
    });

    console.log(`✅ ${rutas.length} rutas encontradas`);

    return {
      success: true,
      data: rutas
    };
  } catch (error) {
    console.error("❌ Error en getRutas:", error);
    return {
      success: false,
      message: error.message
    };
  }
};


// 🔹 Obtener ruta por ID
const getRutaById = async (id) => {
  try {
    console.log(`🔍 Service - Buscando ruta ID: ${id}`);

    const ruta = await prisma.ruta.findUnique({
      where: { id },
      include: {
        viajes: true,
        _count: {
          select: { viajes: true }
        }
      }
    });

    if (!ruta) {
      return {
        success: false,
        message: "Ruta no encontrada"
      };
    }

    return {
      success: true,
      data: ruta
    };
  } catch (error) {
    console.error("❌ Error en getRutaById:", error);
    return {
      success: false,
      message: error.message
    };
  }
};


// 🔹 Crear ruta
// service/rutas.service.js

// 🔹 Crear ruta - VERSIÓN CORREGIDA CON COORDENADAS
const createRuta = async (data) => {
  try {
    console.log('📝 Service - Creando ruta:', data);

    const { 
      origen, 
      destino, 
      precio, 
      distancia,
      origenLat,    // ← AGREGAR
      origenLng,    // ← AGREGAR
      destinoLat,   // ← AGREGAR
      destinoLng    // ← AGREGAR
    } = data;

    if (!origen || !destino || !precio) {
      return {
        success: false,
        message: "Origen, destino y precio son obligatorios"
      };
    }

    // Validar duplicado
    const existingRuta = await prisma.ruta.findFirst({
      where: {
        origen: origen,
        destino: destino,
        estado: true
      }
    });

    if (existingRuta) {
      return {
        success: false,
        message: "Ya existe una ruta con ese origen y destino"
      };
    }

    // ✅ CREAR RUTA CON COORDENADAS
    const ruta = await prisma.ruta.create({
      data: {
        origen: origen,
        destino: destino,
        distancia: distancia ? parseFloat(distancia) : null,
        precio: parseFloat(precio),
        origenLat: origenLat ? parseFloat(origenLat) : null,
        origenLng: origenLng ? parseFloat(origenLng) : null,
        destinoLat: destinoLat ? parseFloat(destinoLat) : null,
        destinoLng: destinoLng ? parseFloat(destinoLng) : null,
        estado: true
      }
    });

    console.log('✅ Ruta creada:', ruta);

    return {
      success: true,
      data: ruta,
      message: "Ruta creada correctamente"
    };

  } catch (error) {
    console.error("❌ Error en createRuta:", error);
    return {
      success: false,
      message: error.message
    };
  }
};


// 🔹 Actualizar ruta
const updateRuta = async (id, data) => {
  try {
    console.log(`📝 Service - Actualizando ruta ID: ${id}`, data);

    const existingRuta = await prisma.ruta.findUnique({
      where: { id }
    });

    if (!existingRuta) {
      return {
        success: false,
        message: "Ruta no encontrada"
      };
    }

    if (data.origen || data.destino) {
      const duplicado = await prisma.ruta.findFirst({
        where: {
          origen: data.origen ?? existingRuta.origen,
          destino: data.destino ?? existingRuta.destino,
          estado: true,
          NOT: { id } // excluir la ruta actual
        }
      });

      if (duplicado) {
        return {
          success: false,
          message: "Ya existe una ruta con ese origen y destino"
        };
      }
    }

    const ruta = await prisma.ruta.update({
      where: { id },
      data: {
        origen: data.origen ?? existingRuta.origen,
        destino: data.destino ?? existingRuta.destino,
        distancia: data.distancia ? parseFloat(data.distancia) : existingRuta.distancia,
        precio: data.precio ? parseFloat(data.precio) : existingRuta.precio,
        estado: data.estado ?? existingRuta.estado, 
      }
    });

    console.log('✅ Ruta actualizada:', ruta);

    return {
      success: true,
      data: ruta,
      message: "Ruta actualizada correctamente"
    };

  } catch (error) {
    console.error("❌ Error en updateRuta:", error);
    return {
      success: false,
      message: error.message
    };
  }
};


// 🔹 Eliminar ruta (soft delete)
const deleteRuta = async (id) => {
  try {
    console.log(`🗑️ Service - Eliminando ruta ID: ${id}`);

    const existingRuta = await prisma.ruta.findUnique({
      where: { id },
      include: {
        _count: {
          select: { viajes: true }
        }
      }
    });

    if (!existingRuta) {
      return {
        success: false,
        message: "Ruta no encontrada"
      };
    }

    if (existingRuta._count.viajes > 0) {
      return {
        success: false,
        message: `No se puede eliminar la ruta porque tiene ${existingRuta._count.viajes} viajes asociados`
      };
    }

    // 🔥 Soft delete (mejor práctica)
    await prisma.ruta.update({
      where: { id },
      data: { estado: false }
    });

    console.log('✅ Ruta desactivada');

    return {
      success: true,
      message: "Ruta eliminada correctamente"
    };

  } catch (error) {
    console.error("❌ Error en deleteRuta:", error);
    return {
      success: false,
      message: error.message
    };
  }
};


module.exports = {
  getRutas,
  getRutaById,
  createRuta,
  updateRuta,
  deleteRuta
};