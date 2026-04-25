

// backend/src/service/email.service.js
const nodemailer = require("nodemailer");

// Configuración SMTP con Hostinger
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // smtp.hostinger.com
  port: process.env.SMTP_PORT, // 465
  secure: true, // true para 465, false para otros puertos
  auth: {
    user: process.env.SMTP_USER, // enterprise@xhionsoft.com
    pass: process.env.SMTP_PASS // 9HgVU8iYLii&
  },
  tls: {
    rejectUnauthorized: false // Esto ayuda con problemas de certificados
  }
});

// Verificar conexión SMTP al iniciar
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Error de conexión SMTP:", error);
  } else {
    console.log("✅ Servidor SMTP listo para enviar emails");
  }
});

async function sendPasswordResetEmail(email, token, name) {
  try {
    // IMPORTANTE: Definir baseUrl - Usar variable de entorno o IP por defecto
    const baseUrl = process.env.BASE_URL || "http://192.168.5.102:3000";
    
    // Construir el link de recuperación
    const resetLink = `${baseUrl}/reset-password?token=${token}`;

    console.log("📧 Enviando correo a:", email);
    console.log("🔗 Enlace generado:", resetLink);
    console.log("👤 Usuario:", name || 'No especificado');

    // Enviar el correo
    const info = await transporter.sendMail({
      from: `"XhionSoft" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Recuperación de contraseña",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recuperar Contraseña</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0fdf4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: #ffffff;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
              border-top: 5px solid #10b981;
            }
            h1 {
              color: #10b981;
              font-size: 28px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            h2 {
              color: #065f46;
              font-size: 20px;
              margin-bottom: 15px;
            }
            p {
              color: #374151;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            
            /* ESTILOS ROBUSTOS PARA EL BOTÓN */
            .button {
              display: inline-block;
              padding: 14px 32px;
              background: #10b981 !important;
              color: #ffffff !important;  /* BLANCO FORZADO */
              text-decoration: none !important;
              border-radius: 5px !important;
              margin: 20px 0 !important;
              font-weight: bold !important;
              border: none !important;
              font-family: Arial, sans-serif !important;
              font-size: 16px !important;
              line-height: 1.5 !important;
              text-align: center !important;
            }
            
            /* ANULAR ESTILOS DE GMAIL/OUTLOOK */
            .button span {
              color: #ffffff !important;
            }
            
            .button:visited,
            .button:active,
            .button:hover,
            .button:focus {
              color: #ffffff !important;
              background: #059669 !important;
              text-decoration: none !important;
            }
            
            .link-box {
              background: #f0fdf4;
              border: 1px solid #a7f3d0;
              padding: 15px;
              border-radius: 8px;
              word-break: break-all;
              font-size: 14px;
              color: #059669;
              margin: 20px 0;
              font-family: monospace;
            }
            .expiry {
              color: #10b981;
              font-weight: bold;
              background: #ecfdf5;
              padding: 10px 15px;
              border-radius: 8px;
              display: inline-block;
              margin: 10px 0;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #d1fae5;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>XhionSoft</h1>
            
            <h2>Hola ${name || 'usuario'},</h2>
            
            <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
            
            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
              <!-- BOTÓN CON ESTILOS EN LÍNEA TAMBIÉN (MÁS SEGURO) -->
              <a href="${resetLink}" 
                 class="button" 
                 style="display: inline-block; padding: 14px 32px; background: #10b981; color: #ffffff; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; border: none; font-family: Arial, sans-serif; font-size: 16px;"
                 target="_blank">
                Restablecer Contraseña
              </a>
            </div>
            
            <p>O copia este enlace en tu navegador:</p>
            
            <div class="link-box">
              ${resetLink}
            </div>
            
            <div class="expiry">
              ⏰ Este enlace expirará en 1 hora
            </div>
            
            <p style="color: #6b7280; font-style: italic; font-size: 14px; margin-top: 20px;">
              Si no solicitaste este cambio, puedes ignorar este correo de forma segura.
            </p>
            
            <div class="footer">
              <p>© 2024 XhionSoft. Todos los derechos reservados.</p>
              <p>Este es un correo automático, por favor no responder.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      // Versión texto plano como fallback
      text: `
XhionSoft

Hola ${name || 'usuario'},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, copia y pega este enlace en tu navegador:
${resetLink}

⏰ Este enlace expirará en 1 hora.

Si no solicitaste este cambio, ignora este correo.

Saludos,
Equipo XhionSoft
      `
    });

    console.log("✅ Email enviado correctamente. ID:", info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("❌ Error al enviar email:", error);
    throw new Error(`Error al enviar email: ${error.message}`);
  }
}

async function sendPasswordChangedEmail(email, name) {
  try {
    const info = await transporter.sendMail({
      from: `"XhionSoft" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "✅ Contraseña cambiada exitosamente",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              background-color: #f0fdf4;
              margin: 0;
              padding: 20px;
            }
            .container {
              max-width: 500px;
              margin: 0 auto;
              background: white;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.1);
              border-top: 5px solid #10b981;
            }
            h1 {
              color: #10b981;
              font-size: 28px;
              margin-top: 0;
              margin-bottom: 20px;
            }
            h2 {
              color: #065f46;
              font-size: 20px;
              margin-bottom: 15px;
            }
            p {
              color: #374151;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            .info-box {
              background: #f0fdf4;
              border: 1px solid #a7f3d0;
              padding: 15px;
              border-radius: 8px;
              margin: 20px 0;
              color: #065f46;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #d1fae5;
              color: #666;
              font-size: 12px;
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>XhionSoft</h1>
            
            <h2>Hola ${name || 'usuario'},</h2>
            
            <p>✅ Tu contraseña fue cambiada correctamente.</p>
            
            <div class="info-box">
              <strong>📅 Fecha y hora:</strong> ${new Date().toLocaleString()}
            </div>
            
            <p style="color: #6b7280; font-size: 13px;">
              ⚠️ Si no realizaste esta acción, contacta a soporte inmediatamente.
            </p>
            
            <div class="footer">
              <p>© 2024 XhionSoft. Todos los derechos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
XhionSoft

Hola ${name || 'usuario'},

✅ Tu contraseña fue cambiada correctamente.
Fecha y hora: ${new Date().toLocaleString()}

⚠️ Si no realizaste esta acción, contacta a soporte inmediatamente.

Saludos,
Equipo XhionSoft
      `
    });

    console.log("✅ Correo de confirmación enviado a:", email);
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("❌ Error al enviar correo de confirmación:", error);
    throw error;
  }
}

// Función para probar la configuración
async function testEmailConfig() {
  try {
    console.log("🔧 Probando configuración de email...");
    console.log("📧 Configuración SMTP:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      secure: true
    });

    await transporter.verify();
    console.log("✅ Configuración SMTP válida");
    
    return { success: true };
  } catch (error) {
    console.error("❌ Error en configuración SMTP:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  testEmailConfig
};