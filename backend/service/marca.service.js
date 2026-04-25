// service/marca.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todas las marcas
const getMarcas = async () => {
  console.log('📦 SERVICIO: getMarcas');
  
  try {
    console.log('🔍 Verificando conexión a DB...');
    await prisma.$connect();
    console.log('✅ Conexión a DB establecida');
    
    console.log('🔍 Ejecutando prisma.marca.findMany()...');
    const marcas = await prisma.marca.findMany({
      orderBy: { nombre: "asc" }
    });
    
    console.log(`✅ Encontradas ${marcas.length} marcas`);
    
    return {
      success: true,
      data: marcas
    };
  } catch (error) {
    console.error('❌ Error en servicio getMarcas:');
    console.error('📛 Nombre:', error.name);
    console.error('📝 Mensaje:', error.message);
    if (error.code) {
      console.error('🔢 Código Prisma:', error.code);
    }
    console.error('📚 Stack:', error.stack);
    
    return {
      success: false,
      message: error.message || 'Error al obtener marcas'
    };
  }
};

// Obtener marca por ID
const getMarcaById = async (id) => {
  try {
    const marca = await prisma.marca.findUnique({
      where: { id },
      include: {
        buses: true
      }
    });

    if (!marca) {
      return {
        success: false,
        message: "Marca no encontrada"
      };
    }

    return {
      success: true,
      data: marca
    };
  } catch (error) {
    console.error('Error en getMarcaById:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Crear marca
const createMarca = async (data) => {
  try {
    console.log('📥 Creando marca:', data);

    if (!data.nombre) {
      return {
        success: false,
        message: "El nombre de la marca es obligatorio"
      };
    }

    // Verificar si la marca ya existe
    const existingMarca = await prisma.marca.findFirst({
      where: { 
        nombre: {
          equals: data.nombre,
          mode: 'insensitive'
        }
      }
    });

    if (existingMarca) {
      return {
        success: false,
        message: "Ya existe una marca con ese nombre"
      };
    }

    const marca = await prisma.marca.create({
      data: {
        nombre: data.nombre
      }
    });

    console.log('✅ Marca creada:', marca);

    return {
      success: true,
      data: marca,
      message: "Marca creada correctamente"
    };
  } catch (error) {
    console.error('❌ Error en createMarca:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Actualizar marca
const updateMarca = async (id, data) => {
  try {
    console.log('📥 Actualizando marca:', id, data);

    const existingMarca = await prisma.marca.findUnique({
      where: { id }
    });

    if (!existingMarca) {
      return {
        success: false,
        message: "Marca no encontrada"
      };
    }

    // Verificar si el nuevo nombre ya existe en otra marca
    if (data.nombre && data.nombre !== existingMarca.nombre) {
      const marcaWithSameName = await prisma.marca.findFirst({
        where: { 
          nombre: {
            equals: data.nombre,
            mode: 'insensitive'
          },
          NOT: { id }
        }
      });

      if (marcaWithSameName) {
        return {
          success: false,
          message: "Ya existe otra marca con ese nombre"
        };
      }
    }

    const marca = await prisma.marca.update({
      where: { id },
      data: {
        nombre: data.nombre
      }
    });

    console.log('✅ Marca actualizada:', marca);

    return {
      success: true,
      data: marca,
      message: "Marca actualizada correctamente"
    };
  } catch (error) {
    console.error('❌ Error en updateMarca:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Eliminar marca
const deleteMarca = async (id) => {
  try {
    console.log('📥 Eliminando marca:', id);

    const existingMarca = await prisma.marca.findUnique({
      where: { id },
      include: {
        buses: true
      }
    });

    if (!existingMarca) {
      return {
        success: false,
        message: "Marca no encontrada"
      };
    }

    // Verificar si tiene buses asociados
    if (existingMarca.buses && existingMarca.buses.length > 0) {
      return {
        success: false,
        message: `No se puede eliminar la marca porque tiene ${existingMarca.buses.length} bus(es) asociado(s)`
      };
    }

    await prisma.marca.delete({
      where: { id }
    });

    console.log('✅ Marca eliminada correctamente');

    return {
      success: true,
      message: "Marca eliminada correctamente"
    };
  } catch (error) {
    console.error('❌ Error en deleteMarca:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

module.exports = {
  getMarcas,
  getMarcaById,
  createMarca,
  updateMarca,
  deleteMarca
};