const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const estadoBusService = {
  // Obtener todos los estados
  getEstados: async () => {
    try {
      const estados = await prisma.estadobus.findMany({
        orderBy: {
          nombre: 'asc'
        }
      });

      return {
        success: true,
        data: estados,
        message: 'Estados obtenidos correctamente'
      };
    } catch (error) {
      console.error('Error en getEstados:', error);
      return {
        success: false,
        message: 'Error al obtener los estados',
        error: error.message
      };
    }
  },

  // Obtener estado por ID
  getEstadoById: async (id) => {
    try {
      const estado = await prisma.estadobus.findUnique({
        where: { id },
        include: {
          buses: {
            select: {
              id: true,
              placa: true,
              marca: true,
              modelo: true
            }
          }
        }
      });

      if (!estado) {
        return {
          success: false,
          message: 'Estado no encontrado'
        };
      }

      return {
        success: true,
        data: estado,
        message: 'Estado obtenido correctamente'
      };
    } catch (error) {
      console.error('Error en getEstadoById:', error);
      return {
        success: false,
        message: 'Error al obtener el estado',
        error: error.message
      };
    }
  },

  // Obtener estado por nombre
  getEstadoByNombre: async (nombre) => {
    try {
      const estado = await prisma.estadobus.findFirst({
        where: {
          nombre: nombre.toUpperCase()
        },
        include: {
          buses: {
            select: {
              id: true,
              placa: true,
              marca: true,
              modelo: true,
              capacidad: true
            }
          }
        }
      });

      if (!estado) {
        return {
          success: false,
          message: `Estado ${nombre} no encontrado`
        };
      }

      return {
        success: true,
        data: estado,
        message: 'Estado obtenido correctamente'
      };
    } catch (error) {
      console.error('Error en getEstadoByNombre:', error);
      return {
        success: false,
        message: 'Error al obtener el estado',
        error: error.message
      };
    }
  },

  // Crear nuevo estado
  createEstado: async (data) => {
    try {
      const { nombre } = data;

      if (!nombre) {
        return {
          success: false,
          message: 'El nombre del estado es obligatorio'
        };
      }

      // Verificar si ya existe
      const existingEstado = await prisma.estadobus.findFirst({
        where: {
          nombre: nombre.toUpperCase()
        }
      });

      if (existingEstado) {
        return {
          success: false,
          message: 'Ya existe un estado con ese nombre'
        };
      }

      // Crear el estado
      const newEstado = await prisma.estadobus.create({
        data: {
          nombre: nombre.toUpperCase()
        }
      });

      return {
        success: true,
        data: newEstado,
        message: 'Estado creado correctamente'
      };
    } catch (error) {
      console.error('Error en createEstado:', error);
      return {
        success: false,
        message: 'Error al crear el estado',
        error: error.message
      };
    }
  },

  // Actualizar estado
  updateEstado: async (id, data) => {
    try {
      const { nombre } = data;

      // Verificar si el estado existe
      const existingEstado = await prisma.estadobus.findUnique({
        where: { id }
      });

      if (!existingEstado) {
        return {
          success: false,
          message: 'Estado no encontrado'
        };
      }

      // Si se actualiza el nombre, verificar que no exista otro con el mismo
      if (nombre && nombre !== existingEstado.nombre) {
        const estadoWithSameNombre = await prisma.estadobus.findFirst({
          where: {
            nombre: nombre.toUpperCase(),
            NOT: { id }
          }
        });

        if (estadoWithSameNombre) {
          return {
            success: false,
            message: 'Ya existe otro estado con ese nombre'
          };
        }
      }

      // Actualizar el estado
      const updatedEstado = await prisma.estadobus.update({
        where: { id },
        data: {
          nombre: nombre ? nombre.toUpperCase() : undefined
        }
      });

      return {
        success: true,
        data: updatedEstado,
        message: 'Estado actualizado correctamente'
      };
    } catch (error) {
      console.error('Error en updateEstado:', error);
      return {
        success: false,
        message: 'Error al actualizar el estado',
        error: error.message
      };
    }
  },

  // Eliminar estado
  deleteEstado: async (id) => {
    try {
      // Verificar si el estado existe
      const existingEstado = await prisma.estadobus.findUnique({
        where: { id },
        include: {
          buses: true
        }
      });

      if (!existingEstado) {
        return {
          success: false,
          message: 'Estado no encontrado'
        };
      }

      // Verificar si tiene buses asociados
      if (existingEstado.buses && existingEstado.buses.length > 0) {
        return {
          success: false,
          message: 'No se puede eliminar el estado porque tiene buses asociados'
        };
      }

      // Eliminar el estado
      await prisma.estadobus.delete({
        where: { id }
      });

      return {
        success: true,
        message: 'Estado eliminado correctamente'
      };
    } catch (error) {
      console.error('Error en deleteEstado:', error);
      return {
        success: false,
        message: 'Error al eliminar el estado',
        error: error.message
      };
    }
  },

  // Obtener estadísticas de uso de estados
  getEstadisticas: async () => {
    try {
      const estados = await prisma.estadobus.findMany({
        include: {
          _count: {
            select: {
              buses: true
            }
          }
        }
      });

      const estadisticas = estados.map(estado => ({
        id: estado.id,
        nombre: estado.nombre,
        totalBuses: estado._count.buses,
        createdAt: estado.createdAt,
        updatedAt: estado.updatedAt
      }));

      return {
        success: true,
        data: estadisticas,
        message: 'Estadísticas obtenidas correctamente'
      };
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      return {
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      };
    }
  }
};

module.exports = estadoBusService;