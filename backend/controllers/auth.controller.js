const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const AuthService = require("../service/auth.service");

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Intentando login con:", email);

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email y password son requeridos" 
      });
    }

    const result = await AuthService.login({ email, password });

    if (!result.success) {
      return res.status(401).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("Error en login:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error interno del servidor" 
    });
  }
};

const register = async (req, res) => {
  try {
    console.log('='.repeat(50));
    console.log('📥 REGISTER - Request recibida');
    console.log('📥 Headers:', {
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent']
    });
    console.log('📥 Body completo:', req.body);
    console.log('📥 Campos individuales:');
    console.log('   - email:', req.body.email);
    console.log('   - password:', req.body.password ? '[PROTECTED]' : '❌ FALTANTE');
    console.log('   - name:', req.body.name || '❌ FALTANTE');
    console.log('   - apellido:', req.body.apellido || '❌ FALTANTE');
    console.log('   - telefono:', req.body.telefono || '❌ FALTANTE');
    console.log('   - dni:', req.body.dni || '❌ FALTANTE');
    console.log('='.repeat(50));

    const { email, password, name, apellido, telefono, dni } = req.body;

    // Validar todos los campos requeridos
    const missingFields = [];
    if (!email) missingFields.push('email');
    if (!password) missingFields.push('password');
    if (!name) missingFields.push('name');
    if (!apellido) missingFields.push('apellido');
    if (!telefono) missingFields.push('telefono');
    if (!dni) missingFields.push('dni');

    if (missingFields.length > 0) {
      console.log('❌ Campos faltantes:', missingFields);
      return res.status(400).json({ 
        success: false,
        message: `Campos requeridos faltantes: ${missingFields.join(', ')}`,
        missingFields
      });
    }

    // Validaciones de formato
    if (!/^\d{8}$/.test(dni)) {
      return res.status(400).json({
        success: false,
        message: 'El DNI debe tener exactamente 8 dígitos'
      });
    }

    if (!/^\d{9}$/.test(telefono)) {
      return res.status(400).json({
        success: false,
        message: 'El teléfono debe tener exactamente 9 dígitos'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El email no tiene un formato válido'
      });
    }

    console.log('✅ Validaciones pasadas, llamando a AuthService.register...');
    
    const result = await AuthService.register({ 
      email, 
      password, 
      name, 
      apellido, 
      telefono, 
      dni 
    });

    console.log('📤 Resultado de AuthService:', result);

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.status(201).json(result);
  } catch (error) {
    console.error("🔴 Error en register:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error interno del servidor" 
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    console.log('📧 FORGOT PASSWORD - Solicitud recibida');
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'El email no tiene un formato válido'
      });
    }

    console.log('📧 Procesando forgot password para:', email);
    const result = await AuthService.forgotPassword({ email });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en forgotPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Verify Reset Token - Verificar token
const verifyResetToken = async (req, res) => {
  try {
    console.log('🔑 VERIFY TOKEN - Solicitud recibida');
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        valid: false,
        message: 'Token es requerido'
      });
    }

    console.log('🔑 Verificando token:', token.substring(0, 10) + '...');
    const result = await AuthService.verifyResetToken({ token });

    return res.status(result.valid ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en verifyResetToken:', error);
    return res.status(500).json({
      valid: false,
      message: 'Error interno del servidor'
    });
  }
};

// Reset Password - Establecer nueva contraseña
const resetPassword = async (req, res) => {
  try {
    console.log('🔄 RESET PASSWORD - Solicitud recibida');
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    console.log('🔄 Procesando reset password');
    const result = await AuthService.resetPassword({ token, newPassword });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en resetPassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Change Password - Cambiar contraseña (usuario logueado)
const changePassword = async (req, res) => {
  try {
    console.log('🔐 CHANGE PASSWORD - Solicitud recibida');
    
    // El userId viene del token (middleware de autenticación)
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente a la actual'
      });
    }

    console.log('🔐 Procesando cambio de contraseña para usuario:', userId);
    const result = await AuthService.changePassword({
      userId,
      currentPassword,
      newPassword
    });

    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en changePassword:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

const updateUser = async (req, res) => {
  try {

    const { id } = req.params;

    console.log("ID PARAM:", id);
    console.log("BODY:", req.body);

    const result = await AuthService.updateUser(id, req.body);

    res.json(result);

  } catch (error) {
    console.log("ERROR CONTROLLER:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar usuario"
    });
  }
};

async function deleteUser(req, res) {
  try {
    // Si envías el ID en el body
    const { id } = req.body;  // ← Para recibir ID del body
    // O si usas params: const { id } = req.params;
    
    console.log('🗑️ Eliminando usuario:', id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID de usuario requerido'
      });
    }

    const result = await AuthService.deleteUser(id); // Pasar el ID
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en deleteUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

async function getUserById(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const result = await AuthService.getUserById({ userId });
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  }
  catch (error) {
    console.error('🔴 Error en getUserById:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error interno del servidor' 
    });
  }
}
// const getall = async (req, res) => {
//   try {
//     console.log('👥 GETALL - Solicitud recibida');
    
//     // Verificar autenticación (el middleware verifyToken ya debería haber validado)
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: 'No autorizado'
//       });
//     }

//     console.log('👥 Usuario autenticado:', req.user.id, 'Rol:', req.user.rol);
    
//     const result = await AuthService.getall();
    
//     console.log('👥 Resultado getall:', result.success ? 'OK' : 'Error');
    
//     return res.status(result.success ? 200 : 400).json(result);
//   } catch (error) {
//     console.error('🔴 Error en getall:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Error interno del servidor'
//     });
//   }
// };

const getall = async (req, res) => {
  try {
    console.log('👥 GETALL - Solicitud recibida');
    console.log('📦 req.user:', req.user); // Ver qué usuario está autenticado
    
    // Verificar autenticación
    if (!req.user) {
      console.log('❌ No autorizado - req.user es undefined');
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    console.log('👤 Usuario autenticado:', req.user.id, 'Rol:', req.user.rol);
    
    console.log('🔍 Llamando a AuthService.getall()');
    const result = await AuthService.getall();
    
    console.log('📊 Resultado del servicio:', JSON.stringify(result, null, 2));
    
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('🔴 Error en getall:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor: ' + error.message
    });
  }
};



module.exports = { login, register, forgotPassword, verifyResetToken, 
  resetPassword, changePassword, updateUser, deleteUser, getUserById,getall };
