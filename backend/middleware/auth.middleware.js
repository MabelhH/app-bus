// // middleware/auth.middleware.js
// const jwt = require('jsonwebtoken');

// const verifyToken = (req, res, next) => {
//   try {
//     // Obtener token del header
//     const authHeader = req.headers['authorization'];
//     if (!authHeader) {
//       return res.status(401).json({
//         success: false,
//         message: "Token requerido"
//       });
//     }
//     const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

//     if (!token) {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Acceso denegado. Token no proporcionado' 
//       });
//     }

//     // Verificar token
//     const decoded = jwt.verify(token, process.env.JWT_SECRET || "tu_secreto_temporal");
    
//     // Agregar información del usuario a la request
//     req.user = decoded;
    
//     next();
//   } catch (error) {
//     if (error.name === 'TokenExpiredError') {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Token expirado' 
//       });
//     }
    
//     if (error.name === 'JsonWebTokenError') {
//       return res.status(401).json({ 
//         success: false, 
//         message: 'Token inválido' 
//       });
//     }
    
//     return res.status(500).json({ 
//       success: false, 
//       message: 'Error al autenticar' 
//     });
//   }
// };


// module.exports = { verifyToken };

// middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const verifyToken = (req, res, next) => {
  console.log('='.repeat(50));
  console.log('🔐 VERIFICANDO TOKEN');
  console.log('📌 Headers recibidos:', {
    authorization: req.headers['authorization'] ? 'Presente' : 'Ausente',
    'content-type': req.headers['content-type']
  });
  
  try {
    // Obtener token del header
    const authHeader = req.headers['authorization'];
    console.log('Auth header completo:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No hay header de autorización');
      return res.status(401).json({
        success: false,
        message: "Token requerido"
      });
    }
    
    const token = authHeader.split(' ')[1]; // Bearer TOKEN
    console.log('Token extraído:', token ? `${token.substring(0, 20)}...` : 'Vacío');

    if (!token) {
      console.log('❌ Token no proporcionado');
      return res.status(401).json({ 
        success: false, 
        message: 'Acceso denegado. Token no proporcionado' 
      });
    }

    // Verificar token
    console.log('🔑 Verificando token...');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "tu_secreto_temporal");
    console.log('✅ Token verificado. Usuario:', decoded.email || decoded.id);
    
    // Agregar información del usuario a la request
    req.user = decoded;
    console.log('='.repeat(50));
    next();
  } catch (error) {
    console.log('❌ Error verificando token:', error.message);
    console.log('📛 Tipo de error:', error.name);
    console.log('='.repeat(50));
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token inválido' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'Error al autenticar' 
    });
  }
};

module.exports = { verifyToken };