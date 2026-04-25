const estadoBusService = require('../service/estadobus.service');

// Obtener todos los estados
const getEstados = async (req, res) => {
  const result = await estadoBusService.getEstados();

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
};

// Obtener estado por ID
const getEstadoById = async (req, res) => {
  const { id } = req.params;

  const result = await estadoBusService.getEstadoById(id);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
};

// Obtener estado por nombre
const getEstadoByNombre = async (req, res) => {
  const { nombre } = req.params;

  const result = await estadoBusService.getEstadoByNombre(nombre);

  if (!result.success) {
    return res.status(404).json(result);
  }

  res.json(result);
};

// Crear nuevo estado
const createEstado = async (req, res) => {
  const result = await estadoBusService.createEstado(req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.status(201).json(result);
};

// Actualizar estado
const updateEstado = async (req, res) => {
  const { id } = req.params;
  const result = await estadoBusService.updateEstado(id, req.body);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

// Eliminar estado
const deleteEstado = async (req, res) => {
  const { id } = req.params;
  const result = await estadoBusService.deleteEstado(id);

  if (!result.success) {
    return res.status(400).json(result);
  }

  res.json(result);
};

// Obtener estadísticas
const getEstadisticas = async (req, res) => {
  const result = await estadoBusService.getEstadisticas();

  if (!result.success) {
    return res.status(500).json(result);
  }

  res.json(result);
};

module.exports = {
  getEstados,
  getEstadoById,
  getEstadoByNombre,
  createEstado,
  updateEstado,
  deleteEstado,
  getEstadisticas
};