// controllers/marca.controller.js
const marcaService = require('../service/marca.service');

const getMarcas = async (req, res) => {
  console.log('='.repeat(50));
  console.log('🎮 CONTROLADOR: getMarcas');
  console.log('👤 Usuario autenticado:', req.user?.email || req.user?.id);
  
  try {
    console.log('🔍 Llamando a marcaService.getMarcas()...');
    const result = await marcaService.getMarcas();
    console.log('📦 Resultado del servicio:', result);
    
    if (result.success) {
      console.log(`✅ Enviando ${result.data.length} marcas`);
      return res.status(200).json({
        success: true,
        data: result.data,
        message: "Marcas obtenidas correctamente"
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

// Obtener marca por ID
const getMarcaById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await marcaService.getMarcaById(id);
    
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
    console.error('Error en getMarcaById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear marca
const createMarca = async (req, res) => {
  try {
    const { nombre } = req.body;
    
    const result = await marcaService.createMarca({ nombre });
    
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
    console.error('Error en createMarca controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar marca
const updateMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre } = req.body;
    
    const result = await marcaService.updateMarca(id, { nombre });
    
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
    console.error('Error en updateMarca controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar marca
const deleteMarca = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await marcaService.deleteMarca(id);
    
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
    console.error('Error en deleteMarca controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getMarcas,
  getMarcaById,
  createMarca,
  updateMarca,
  deleteMarca
};