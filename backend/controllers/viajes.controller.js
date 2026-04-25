const ViajeService = require('../service/viajes.service');


// 🔹 Obtener todos los viajes
const getAllViajes = async (req, res) => {
  try {
    console.log('🚌 Controller - Obteniendo viajes');

    const result = await ViajeService.getViajes();
    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en getAllViajes:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 🔹 Obtener viaje por ID
const getViajeById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Controller - Obteniendo viaje ID:', id);

    const result = await ViajeService.getViajeById(id);
    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en getViajeById:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 🔹 Crear viaje
const createViaje = async (req, res) => {
  try {
    console.log('📝 Controller - Creando viaje');
    console.log('📦 Body:', req.body);

    const {fecha, hora, busId, rutaId, idEstadoViaje } = req.body;

    if ( !fecha || !hora || !busId || !rutaId || !idEstadoViaje) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios"
      });
    }

    const result = await ViajeService.createViaje({
      fecha,
      hora,
      busId,
      rutaId,
      idEstadoViaje
    });

    return res.status(result.success ? 201 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en createViaje:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 🔹 Actualizar viaje
const updateViaje = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('📝 Controller - Actualizando viaje ID:', id);
    console.log('📦 Body:', req.body);

    const result = await ViajeService.updateViaje(id, req.body);

    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en updateViaje:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// 🔹 Eliminar viaje
const deleteViaje = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Controller - Eliminando viaje ID:', id);

    const result = await ViajeService.deleteViaje(id);

    return res.status(result.success ? 200 : 400).json(result);

  } catch (error) {
    console.error('🔴 Error en deleteViaje:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


module.exports = {
  getAllViajes,
  getViajeById,
  createViaje,
  updateViaje,
  deleteViaje
};