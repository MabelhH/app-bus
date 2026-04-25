// backend/src/service/rol.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Obtener todos los roles
const getRoles = async () => {
  try {
    console.log('🔍 Service - Obteniendo todos los roles');
    
    const roles = await prisma.rol.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { users: true }
        }
      }
    });
    
    console.log(`✅ ${roles.length} roles encontrados`);
    return {
      success: true,
      data: roles
    };
  } catch (error) {
    console.error("❌ Error en getRoles:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Obtener rol por ID
const getRolById = async (id) => {
  try {
    console.log(`🔍 Service - Buscando rol ID: ${id}`);
    
    const rol = await prisma.rol.findUnique({
      where: { id }, // id ya es string, no usar Number()
      include: {
        _count: {
          select: { users: true }
        }
      }
    });

    if (!rol) {
      return {
        success: false,
        message: "Rol no encontrado"
      };
    }

    return {
      success: true,
      data: rol
    };
  } catch (error) {
    console.error("❌ Error en getRolById:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Crear nuevo rol
const createRol = async (data) => {
  try {
    console.log('📝 Service - Creando rol:', data);

    // Verificar si ya existe
    const existingRol = await prisma.rol.findUnique({
      where: { name: data.name }
    });

    if (existingRol) {
      return {
        success: false,
        message: "El rol ya existe"
      };
    }

    const rol = await prisma.rol.create({
      data: {
        name: data.name.toUpperCase()
      }
    });

    console.log('✅ Rol creado:', rol);
    return {
      success: true,
      data: rol
    };
  } catch (error) {
    console.error("❌ Error en createRol:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Actualizar rol
const updateRol = async (id, data) => {
  try {
    console.log(`📝 Service - Actualizando rol ID: ${id}`, data);

    // Verificar si existe
    const existingRol = await prisma.rol.findUnique({
      where: { id }
    });

    if (!existingRol) {
      return {
        success: false,
        message: "Rol no encontrado"
      };
    }

    // Verificar si el nuevo nombre ya existe en otro rol
    if (data.name !== existingRol.name) {
      const nameExists = await prisma.rol.findUnique({
        where: { name: data.name }
      });

      if (nameExists) {
        return {
          success: false,
          message: "Ya existe un rol con ese nombre"
        };
      }
    }

    const rol = await prisma.rol.update({
      where: { id },
      data: {
        name: data.name.toUpperCase()
      }
    });

    console.log('✅ Rol actualizado:', rol);
    return {
      success: true,
      data: rol
    };
  } catch (error) {
    console.error("❌ Error en updateRol:", error);
    return {
      success: false,
      message: error.message
    };
  }
};

// Eliminar rol - CORREGIDO
const deleteRol = async (id) => {
  try {
    console.log(`🗑️ Service - Eliminando rol ID: ${id}`);

    // ✅ USAR 'idrol' que es el nombre correcto del campo
    const usersCount = await prisma.user.count({
      where: { 
        idrol: id  // Cambiado de 'rolId' a 'idrol'
      }
    });

    console.log(`📊 Usuarios con este rol: ${usersCount}`);

    if (usersCount > 0) {
      return {
        success: false,
        message: `No se puede eliminar el rol porque tiene ${usersCount} usuarios asociados`
      };
    }

    await prisma.rol.delete({
      where: { id }
    });

    console.log('✅ Rol eliminado');
    return {
      success: true,
      message: "Rol eliminado correctamente"
    };
  } catch (error) {
    console.error("❌ Error en deleteRol:", error);
    return {
      success: false,
      message: error.message
    };
  }
};
module.exports = {
  getRoles,
  getRolById,
  createRol,
  updateRol,
  deleteRol
};