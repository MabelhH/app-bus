const RutaService = require('../service/rutas.service');


// 🔹 Obtener todas las rutas
const getAllRutas = async (req, res) => {
  try {
    console.log('🛣️ Controller - Obteniendo todas las rutas');

    const result = await RutaService.getRutas();
    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en getAllRutas:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 🔹 Obtener ruta por ID
const getRutaById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Controller - Obteniendo ruta ID:', id);

    const result = await RutaService.getRutaById(id);
    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en getRutaById:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 🔹 Crear ruta
// controllers/rutas.controller.js

// 🔹 Crear ruta - VERSIÓN CORREGIDA
const createRuta = async (req, res) => {
  try {
    console.log('📝 Controller - Creando ruta');
    console.log('📦 Body:', req.body);

    const { 
      origen, 
      destino, 
      distancia, 
      precio,
      origenLat,    // ← AGREGAR
      origenLng,    // ← AGREGAR
      destinoLat,   // ← AGREGAR
      destinoLng    // ← AGREGAR
    } = req.body;

    if (!origen || !destino || !precio) {
      return res.status(400).json({
        success: false,
        message: 'Origen, destino y precio son obligatorios'
      });
    }

    const result = await RutaService.createRuta({
      origen,
      destino,
      distancia,
      precio,
      origenLat,    // ← AGREGAR
      origenLng,    // ← AGREGAR
      destinoLat,   // ← AGREGAR
      destinoLng    // ← AGREGAR
    });

    console.log('📤 Resultado:', result);

    return res.status(result.success ? 201 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en createRuta:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// 🔹 Actualizar ruta - VERSIÓN CORREGIDA
const updateRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      origen, 
      destino, 
      distancia, 
      precio,
      origenLat,    // ← AGREGAR
      origenLng,    // ← AGREGAR
      destinoLat,   // ← AGREGAR
      destinoLng,   // ← AGREGAR
      estado 
    } = req.body;

    console.log('📝 Controller - Actualizando ruta ID:', id);
    console.log('📦 Datos:', req.body);

    const result = await RutaService.updateRuta(id, {
      origen,
      destino,
      distancia,
      precio,
      origenLat,
      origenLng,
      destinoLat,
      destinoLng,
      estado
    });

    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en updateRuta:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};




// 🔹 Eliminar ruta
const deleteRuta = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Controller - Eliminando ruta ID:', id);

    const result = await RutaService.deleteRuta(id);
    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en deleteRuta:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  getAllRutas,
  getRutaById,
  createRuta,
  updateRuta,
  deleteRuta
};