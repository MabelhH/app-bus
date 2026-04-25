// service/estadoviaje.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los estados
const getEstadosViaje = async () => {
  try {
    console.log('🔍 Service - Obteniendo estados de viaje');
    
    const estados = await prisma.estadoviaje.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { viajes: true }
        }
      }
    });
    
    console.log(`✅ ${estados.length} estados encontrados`);
    
    return {
      success: true,
      data: estados
    };
  } catch (error) {
    console.error("❌ Error en getEstadosViaje:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Obtener estado por ID
const getEstadoById = async (id) => {
  try {
    console.log(`🔍 Service - Buscando estado ID: ${id}`);
    
    const estado = await prisma.estadoviaje.findUnique({
      where: { id },
      include: {
        _count: {
          select: { viajes: true }
        }
      }
    });
    
    if (!estado) {
      return {
        success: false,
        message: "Estado no encontrado"
      };
    }
    
    return {
      success: true,
      data: estado
    };
  } catch (error) {
    console.error("❌ Error en getEstadoById:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Crear estado
const createEstado = async (data) => {
  try {
    console.log('📝 Service - Creando estado:', data);
    
    if (!data.nombre) {
      return {
        success: false,
        message: "El nombre del estado es obligatorio"
      };
    }
    
    // Verificar si ya existe
    const existingEstado = await prisma.estadoviaje.findUnique({
      where: { nombre: data.nombre.toUpperCase() }
    });
    
    if (existingEstado) {
      return {
        success: false,
        message: "Ya existe un estado con ese nombre"
      };
    }
    
    const estado = await prisma.estadoviaje.create({
      data: {
        nombre: data.nombre.toUpperCase()
      }
    });
    
    console.log('✅ Estado creado:', estado);
    
    return {
      success: true,
      data: estado,
      message: "Estado creado correctamente"
    };
  } catch (error) {
    console.error("❌ Error en createEstado:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Actualizar estado
const updateEstado = async (id, data) => {
  try {
    console.log(`📝 Service - Actualizando estado ID: ${id}`, data);
    
    const existingEstado = await prisma.estadoviaje.findUnique({
      where: { id }
    });
    
    if (!existingEstado) {
      return {
        success: false,
        message: "Estado no encontrado"
      };
    }
    
    // Verificar si el nuevo nombre ya existe
    if (data.nombre && data.nombre !== existingEstado.nombre) {
      const nombreExists = await prisma.estadoviaje.findUnique({
        where: { nombre: data.nombre.toUpperCase() }
      });
      
      if (nombreExists) {
        return {
          success: false,
          message: "Ya existe un estado con ese nombre"
        };
      }
    }
    
    const estado = await prisma.estadoviaje.update({
      where: { id },
      data: {
        nombre: data.nombre ? data.nombre.toUpperCase() : existingEstado.nombre
      }
    });
    
    console.log('✅ Estado actualizado:', estado);
    
    return {
      success: true,
      data: estado,
      message: "Estado actualizado correctamente"
    };
  } catch (error) {
    console.error("❌ Error en updateEstado:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Eliminar estado
const deleteEstado = async (id) => {
  try {
    console.log(`🗑️ Service - Eliminando estado ID: ${id}`);
    
    const existingEstado = await prisma.estadoviaje.findUnique({
      where: { id },
      include: {
        _count: {
          select: { viajes: true }
        }
      }
    });
    
    if (!existingEstado) {
      return {
        success: false,
        message: "Estado no encontrado"
      };
    }
    
    // Verificar si tiene viajes asociados
    if (existingEstado._count.viajes > 0) {
      return {
        success: false,
        message: `No se puede eliminar el estado porque tiene ${existingEstado._count.viajes} viaje(s) asociado(s)`
      };
    }
    
    await prisma.estadoviaje.delete({
      where: { id }
    });
    
    console.log('✅ Estado eliminado');
    
    return {
      success: true,
      message: "Estado eliminado correctamente"
    };
  } catch (error) {
    console.error("❌ Error en deleteEstado:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  getEstadosViaje,
  getEstadoById,
  createEstado,
  updateEstado,
  deleteEstado
};