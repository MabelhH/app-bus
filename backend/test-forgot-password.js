// backend/test-forgot-password.js
require('dotenv').config();
const { forgotPassword, verifyResetToken, resetPassword } = require('./src/service/auth.service');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testForgotPassword() {
  console.log("=".repeat(50));
  console.log("🔐 PRUEBA DE RECUPERACIÓN DE CONTRASEÑA");
  console.log("=".repeat(50));

  try {
    // 1. SOLICITAR RECUPERACIÓN
    console.log("\n📧 1. SOLICITANDO RECUPERACIÓN");
    console.log("-".repeat(30));
    
    const email = "clarahuanaco20@gmail.com"; // Cambia por el email que quieras probar
    
    console.log(`Enviando solicitud para: ${email}`);
    
    const forgotResult = await forgotPassword({ email });
    
    console.log("✅ Resultado:", forgotResult);

    // 2. BUSCAR TOKEN EN BASE DE DATOS
    console.log("\n🔍 2. BUSCANDO TOKEN EN BASE DE DATOS");
    console.log("-".repeat(30));
    
    // Buscar el token más reciente para este email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (user) {
      const resetRequest = await prisma.passwordReset.findFirst({
        where: {
          userId: user.id,
          expires: { gt: new Date() }
        },
        orderBy: {
          expires: 'desc'
        }
      });

      if (resetRequest) {
        console.log("✅ Token encontrado:");
        console.log("📝 Token:", resetRequest.token);
        console.log("⏰ Expira:", resetRequest.expires);
        
        // 3. VERIFICAR TOKEN
        console.log("\n✅ 3. VERIFICANDO TOKEN");
        console.log("-".repeat(30));
        
        const verifyResult = await verifyResetToken({ 
          token: resetRequest.token 
        });
        
        console.log("Resultado verificación:", verifyResult);

        // 4. OPCIÓN: PROBAR RESETEO DE CONTRASEÑA (opcional)
        // console.log("\n🔑 4. PROBANDO RESETEO DE CONTRASEÑA (opcional)");
        // console.log("-".repeat(30));
        
        // const resetResult = await resetPassword({
        //   token: resetRequest.token,
        //   newPassword: "NuevaPass123!"
        // });
        
        // console.log("Resultado reset:", resetResult);
        
      } else {
        console.log("❌ No se encontraron tokens activos para este usuario");
      }
    } else {
      console.log("❌ Usuario no encontrado");
    }

  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    await prisma.$disconnect();
    console.log("\n" + "=".repeat(50));
    console.log("🏁 PRUEBA COMPLETADA");
    console.log("=".repeat(50));
  }
}

// Ejecutar la prueba
testForgotPassword();