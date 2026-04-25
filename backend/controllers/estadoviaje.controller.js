// controllers/estadoviaje.controller.js
const estadoViajeService = require('../service/estadoviaje.service');

// Obtener todos los estados
const getEstadosViaje = async (req, res) => {
  console.log('='.repeat(50));
  console.log('🎮 CONTROLADOR: getEstadosViaje');
  console.log('👤 Usuario autenticado:', req.user?.email || req.user?.id);
  
  try {
    const result = await estadoViajeService.getEstadosViaje();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data,
        message: "Estados obtenidos correctamente"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('❌ Error en controlador:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estado por ID
const getEstadoById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await estadoViajeService.getEstadoById(id);
    
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
    console.error('Error en getEstadoById:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear estado
const createEstado = async (req, res) => {
  try {
    const { nombre } = req.body;
    
    const result = await estadoViajeService.createEstado({ nombre });
    
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
    console.error('Error en createEstado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar estado
const updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    const result = await estadoViajeService.updateEstado(id, { nombre });
    
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
    console.error('Error en updateEstado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar estado
const deleteEstado = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await estadoViajeService.deleteEstado(id);
    
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
    console.error('Error en deleteEstado:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getEstadosViaje,
  getEstadoById,
  createEstado,
  updateEstado,
  deleteEstado
};