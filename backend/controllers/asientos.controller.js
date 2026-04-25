// controllers/asiento.controller.js
const asientoService = require('../service/asientos.service');

// Obtener todos los asientos
const getAsientos = async (req, res) => {
  console.log('='.repeat(50));
  console.log('🎮 CONTROLADOR: getAsientos');
  console.log('👤 Usuario autenticado:', req.user?.email || req.user?.id);
  
  try {
    console.log('🔍 Llamando a asientoService.getAsientos()...');
    const result = await asientoService.getAsientos();
    console.log('📦 Resultado del servicio:', result);
    
    if (result.success) {
      console.log(`✅ Enviando ${result.data.length} asientos`);
      return res.status(200).json({
        success: true,
        data: result.data,
        message: "Asientos obtenidos correctamente"
      });
    } else {
      console.log('❌ Error del servicio:', result.message);
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ Error en controlador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  } finally {
    console.log('='.repeat(50));
  }
};

const getAsientosByBus = async (req, res) => {
  try {
    const { busId } = req.params;
    const { viajeId } = req.query; 
    const userId = req.user?.id; // Obtener ID de usuario autenticado
    
    console.log('🎮 CONTROLADOR: getAsientosByBus');
    console.log('📌 Bus ID:', busId);
    console.log('📌 Viaje ID:', viajeId);
    console.log('User ID:', userId);

    
    const result = await asientoService.getAsientosByBus(busId, viajeId, userId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        total: result.total,
        message: result.message
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en getAsientosByBus controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener asiento por ID
const getAsientoById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🎮 CONTROLADOR: getAsientoById - ID: ${id}`);
    
    const result = await asientoService.getAsientoById(id);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(404).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en getAsientoById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear asiento individual
const createAsiento = async (req, res) => {
  try {
    const { numeroAsiento, busId } = req.body;
    
    console.log('🎮 CONTROLADOR: createAsiento');
    console.log('📥 Datos recibidos:', { numeroAsiento, busId });
    
    const result = await asientoService.createAsiento({ numeroAsiento, busId });
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en createAsiento controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear múltiples asientos
const createMultipleAsientos = async (req, res) => {
  try {
    const { busId, asientos } = req.body;
    
    console.log('🎮 CONTROLADOR: createMultipleAsientos');
    console.log('📥 Datos recibidos:', { busId, asientos });
    
    // Validar datos
    if (!busId || !asientos || !Array.isArray(asientos) || asientos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se requiere busId y un array de números de asiento"
      });
    }
    
    const result = await asientoService.createMultipleAsientos({ busId, asientos });
    
    if (result.success) {
      return res.status(201).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en createMultipleAsientos controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar asiento
const updateAsiento = async (req, res) => {
  try {
    const { id } = req.params;
    const { numeroAsiento, busId } = req.body;
    
    console.log('🎮 CONTROLADOR: updateAsiento');
    console.log('📥 Datos recibidos:', { id, numeroAsiento, busId });
    
    const result = await asientoService.updateAsiento(id, { numeroAsiento, busId });
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en updateAsiento controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar asiento individual
const deleteAsiento = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🎮 CONTROLADOR: deleteAsiento');
    console.log('📥 Eliminando asiento ID:', id);
    
    const result = await asientoService.deleteAsiento(id);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en deleteAsiento controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar todos los asientos de un bus
const deleteAsientosByBus = async (req, res) => {
  try {
    const { busId } = req.params;
    
    console.log('🎮 CONTROLADOR: deleteAsientosByBus');
    console.log('📥 Eliminando asientos del bus ID:', busId);
    
    const result = await asientoService.deleteAsientosByBus(busId);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en deleteAsientosByBus controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const agregarAsientos = async (req, res) => {
  try {
    const { busId } = req.params;
    const { capacidad } = req.body;

    if (!capacidad) {
      return res.status(400).json({
        success: false,
        message: "La capacidad es requerida"
      });
    }

    const result = await asientosService.agregarAsientosABus(busId, capacidad);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en agregarAsientos:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// NUEVO: Obtener asientos con estado para viaje
const getAsientosPorViaje = async (req, res) => {
  try {
    const { viajeId } = req.params;

    const result = await asientosService.getAsientosConEstadoParaViaje(viajeId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en getAsientosPorViaje:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// NUEVO: Actualizar capacidad del bus
const actualizarCapacidad = async (req, res) => {
  try {
    const { busId } = req.params;
    const { capacidad } = req.body;

    if (!capacidad) {
      return res.status(400).json({
        success: false,
        message: "La capacidad es requerida"
      });
    }

    const result = await asientosService.actualizarCapacidadBus(busId, capacidad);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en actualizarCapacidad:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// ✅ CORREGIDO: Elimina el "controller" que estaba de más
module.exports = {
  getAsientos,
  getAsientosByBus,
  getAsientoById,
  createAsiento,
  createMultipleAsientos,
  updateAsiento,
  deleteAsiento,
  deleteAsientosByBus,
  agregarAsientos,
  getAsientosPorViaje,
  actualizarCapacidad
};