const busService = require('../service/bus.service');
const trackingService = require('../service/tracking.service');

// Obtener todos los buses
const getBuses = async (req, res) => {
  try {
    const result = await busService.getBus();
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result.data
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('Error en getBuses controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener bus por ID
const getBusById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await busService.getBusById(id);
    
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
    console.error('Error en getBusById controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear bus
const createBus = async (req, res) => {
  try {
    const { placa, marcaId, modelo, capacidad, estadoId } = req.body;
    
    console.log('📥 Controller createBus - Datos recibidos:', { placa, marcaId, modelo, capacidad, estadoId });
    
    const result = await busService.createBus({
      placa,
      marcaId,
      modelo,
      capacidad,
      estadoId
    });
    
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
    console.error('Error en createBus controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar bus
const updateBus = async (req, res) => {
  try {
    const { id } = req.params;
    const { placa, marcaId, modelo, capacidad, estadoId } = req.body;
    
    const result = await busService.updateBus(id, {
      placa,
      marcaId,
      modelo,
      capacidad,
      estadoId
    });
    
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
    console.error('Error en updateBus controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar bus
const deleteBus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await busService.deleteBus(id);
    
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
    console.error('Error en deleteBus controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const reportarUbicacion = async (req, res) => {
  try {
    const { busId, lat, lng, speed, viajeId } = req.body;
    if (!busId || lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: 'Faltan busId, lat o lng' });
    }
    const ubicacion = await trackingService.saveLocation(busId, parseFloat(lat), parseFloat(lng), speed || 0, viajeId || null);
    res.status(201).json({ success: true, data: ubicacion });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const obtenerUltimaUbicacion = async (req, res) => {
  try {
    const { busId } = req.params;
    const ubicacion = await trackingService.getLastLocation(busId);
    if (!ubicacion) return res.status(404).json({ success: false, message: 'No hay ubicaciones' });
    res.json({ success: true, data: ubicacion });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const obtenerBusesActivos = async (req, res) => {
  try {
    // Obtiene buses que han actualizado su ubicación en los últimos 5 minutos
    const buses = await trackingService.getActiveBuses(5);
    res.json({ success: true, data: buses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const obtenerHistorialUbicaciones = async (req, res) => {
  try {
    const { busId } = req.params;
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 100;
    const historial = await trackingService.getLocationHistory(busId, hours, limit);
    res.json({ success: true, data: historial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getBuses,
  getBusById,
  createBus,
  updateBus,
  deleteBus,
  reportarUbicacion,
  obtenerUltimaUbicacion,
  obtenerBusesActivos,
  obtenerHistorialUbicaciones
};