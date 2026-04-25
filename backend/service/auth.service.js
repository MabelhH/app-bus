// auth.service.js
const axios = require("axios");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require("crypto");
const { PrismaClient } = require('@prisma/client');
const emailService = require('../service/email.service');

const prisma = new PrismaClient();

async function login({ email, password }) {
  try {
    // Buscar usuario por email
    const user = await prisma.user.findUnique({
      where: { email },
      include: { rol: true }
    });

    if (!user) {
      return {
        success: false,
        message: 'Credenciales inválidas'
      };
    }

    // Verificar si el usuario está activo
    if (!user.estado) {
      return {
        success: false,
        message: 'Usuario inactivo'
      };
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);

    
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Credenciales inválidas'
      };
    }

    // Generar token
    const token = jwt.sign(
      {  
        id: user.id,
        email: user.email,
        rol: user.rol.name  // Asegúrate de que el rol se incluya en el token 
      },
      process.env.JWT_SECRET || "tu_secreto_temporal",
      { expiresIn: "1d" }
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apellido: user.apellido,
        telefono: user.telefono,
        dni: user.dni,
        memberSince: user.memberSince,
        rol: user.rol.name,
        token
      }
    };

  } catch (error) {
    console.error("Error en login service:", error);
    return {
      success: false,
      message: 'Error en el servidor'
    };
  }
}


async function register({ email, password, name, apellido, telefono, dni }) {
  try {

    const existingUser = await prisma.user.findUnique({
      where: { email}
    });

    if (existingUser) {
      return {
        success: false,
        message: "El usuario ya existe"
      };
    }

    const existingDni = await prisma.user.findUnique({
      where: { dni }
    });

    
    if (existingDni) {
      return {
        success: false,
        message: "El DNI ya está registrado"
      };
    }

    const existingtelefono = await prisma.user.findFirst({
      where: { telefono }
    });

    if (existingtelefono) {
      return {
        success: false,
        message: "El teléfono ya está registrado"
      };
    }

    const rol = await prisma.rol.findUnique({
      where: { name: "ADMIN" }
    });
    const estado = await prisma.estadousuario.findFirst({
      where: { nombre: "ACTIVO" }
    });

    if (!rol) {
      return {
        success: false,
        message: "Rol user no encontrado"
      };
    }
    // console.log("dni:", dni);
    // console.log("telefono:", telefono);
    // console.log("nombre:", name);
    // console.log("email:", email);
    // console.log("apellido:", apellido);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        apellido,
        telefono,
        dni,
        rol: {
          connect: { id: rol.id }
        },
        estadoUsuario: {
          connect: { id: estado.id }
        }
      }
    });

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        rol: rol.name
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name,
        apellido,
        rol: rol.name,
        token
      }
    };

  } catch (error) {
    console.error("ERROR REGISTER:", error);
    return {
      success: false,
      message: error.message
    };
  }
}

// auth.service.js - Ya tienes la función getall implementada correctamente
// auth.service.js
async function getall() {
  try {
    const users = await prisma.user.findMany({
      include: {
        rol: true,
        estadoUsuario: true
      }
    });
    
    return {
      success: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        apellido: user.apellido,
        telefono: user.telefono,
        dni: user.dni,
        memberSince: user.memberSince,
        rol: user.rol, // Incluye el objeto rol completo
        estado: user.estadoUsuario
      }))
    };
  } catch (error) {
    console.error("ERROR GETALL:", error);
    return {
      success: false,
      message: error.message
    };
  }
}


async function getUserById(id) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        rol: true,
        estadoUsuario: true
      }
    });
    if (!user) {
      return {
        success: false,
        message: 'Usuario no encontrado'
      };
    }
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        apellido: user.apellido,
        telefono: user.telefono,
        dni: user.dni,
        memberSince: user.memberSince,
        rol: user.rol.name,
        estado: user.estadoUsuario.nombre
      }
    };
  } catch (error) {
    console.error("ERROR GETUSERBYID:", error);
    return {
      success: false,
      message: error.message
    };
  }
}


async function updateUser(id, { name, apellido, telefono, email }) {
  try {

    console.log("ID recibido:", id);
    console.log("Datos recibidos:", { name, apellido, telefono, email });

    const user = await prisma.user.update({
      where: {
        id: id
      },
      data: {
        name,
        apellido,
        telefono,
        email
      }
    });

    return {
      success: true,
      data: user
    };

  } catch (error) {

    console.log("❌ ERROR PRISMA:", error);

    return {
      success: false,
      message: error.message
    };
  }
}

async function deleteUser(id) {
  try {
    console.log("🗑️ Service - Eliminando usuario:", id);

    await prisma.passwordReset.deleteMany({
      where: { userId: id }  // ✅ CORRECTO: usar el parámetro id
    });

    // 1️⃣ Primero, eliminar todas las reservas del usuario
    await prisma.reserva.deleteMany({
      where: { userId: id }
    });

    // 2️⃣ Luego eliminar el usuario
    await prisma.user.delete({
      where: { id }
    });

    return {
      success: true,
      message: "Usuario y sus reservas eliminados exitosamente"
    };
  } catch (error) {
    console.error("❌ Error en deleteUser service:", error);
    return {
      success: false,
      message: error.message
    };
  }
}
 async function forgotPassword({ email }) {
  try {

    console.log("📧 Procesando forgot password para:", email);

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return {
        success: true,
        message: 'Si el email existe, recibirás instrucciones'
      };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await prisma.passwordReset.create({
      data: {
        token,
        expires,
        userId: user.id
      }
    });

    console.log("TOKEN GENERADO:", token);
    console.log("🔑 Token:", token);
    console.log("⏰ Expira:", expires);

    //⚠️ COMENTA EL EMAIL
   
    try {
      await emailService.sendPasswordResetEmail(
        user.email,
        token,
        user.name || 'Usuario'
      );
      console.log("📧 Email enviado exitosamente a:", user.email);
    } catch (emailError) {
      console.error("❌ Error enviando email:", emailError);
      // No fallamos la operación completa si el email falla
      // Solo registramos el error
    }

    return {
      success: true,
      message: 'Token generado correctamente'
    };

  } catch (error) {
    console.error("Error en forgotPassword:", error);
    return {
      success: false,
      message: 'Error al procesar la solicitud'
    };
  }
}
// 2. VERIFICAR TOKEN
async function verifyResetToken({ token }) {
  try {
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        token,
        expires: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!resetRequest) {
      return {
        valid: false,
        message: 'Token inválido o expirado'
      };
    }

    return {
      valid: true,
      message: 'Token válido',
      userId: resetRequest.userId
    };

  } catch (error) {
    console.error("Error en verifyToken:", error);
    return {
      valid: false,
      message: 'Error al verificar token'
    };
  }
}

// 3. RESETEAR CONTRASEÑA (con token)
async function resetPassword({ token, newPassword }) {
  try {
    // Validar longitud de contraseña
    if (newPassword.length < 6) {
      return {
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      };
    }

    // Buscar token válido
    const resetRequest = await prisma.passwordReset.findFirst({
      where: {
        token,
        expires: { gt: new Date() }
      },
      include: {
        user: true
      }
    });

    if (!resetRequest) {
      return {
        success: false,
        message: 'Token inválido o expirado'
      };
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await prisma.user.update({
      where: { id: resetRequest.userId },
      data: { password: hashedPassword }
    });

    // Eliminar token usado
    await prisma.passwordReset.delete({
      where: { id: resetRequest.id }
    });

    // Enviar email de confirmación
    await emailService.sendPasswordChangedEmail(
      resetRequest.user.email,
      resetRequest.user.name
    );

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };

  } catch (error) {
    console.error("Error en resetPassword:", error);
    return {
      success: false,
      message: 'Error al restablecer la contraseña'
    };
  }
}
async function changePassword({ userId, currentPassword, newPassword }) {
  try {

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, message: "Usuario no encontrado" };
    }

    const match = await bcrypt.compare(currentPassword, user.password);

    if (!match) {
      return { success: false, message: "Contraseña actual incorrecta" };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return {
      success: true,
      message: "Contraseña actualizada correctamente"
    };

  } catch (error) {
    console.error("Error changePassword:", error);
    return {
      success: false,
      message: "Error al cambiar la contraseña"
    };
  }
}

// Agrega esta función al final de auth.service.js para probar
async function testEmailService() {
  try {
    console.log("🔧 Probando servicio de email...");
    
    const testResult = await emailService.testEmailConfig();
    console.log("Resultado prueba email:", testResult);
    
    return testResult;
  } catch (error) {
    console.error("Error probando email:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { login, register , forgotPassword, 
  verifyResetToken, resetPassword, changePassword,
  getall, getUserById, updateUser, deleteUser,testEmailService };