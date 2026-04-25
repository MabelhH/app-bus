// backend/src/controllers/rol.controller.js
const RolService = require('../service/rol.service');

const getAllRoles = async (req, res) => {
  try {
    console.log('👥 Controller - Obteniendo todos los roles');
    const result = await RolService.getRoles();
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en getAllRoles:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔍 Controller - Obteniendo rol ID:', id);
    
    const result = await RolService.getRolById(id);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en getRoleById:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const createRole = async (req, res) => {
  try {
    console.log('📝 Controller - Creando rol');
    console.log('📦 Body:', req.body);

    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol es requerido'
      });
    }

    const result = await RolService.createRol({ name });
    console.log('📤 Resultado:', result);
    
    return res.status(result.success ? 201 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en createRole:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    console.log('📝 Controller - Actualizando rol ID:', id);
    console.log('📦 Datos:', { name });

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del rol es requerido'
      });
    }

    const result = await RolService.updateRol(id, { name });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en updateRole:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Controller - Eliminando rol ID:', id);

    const result = await RolService.deleteRol(id);
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en deleteRole:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};