// backend/jobs/liberarAsientosJob.js
const cron = require('node-cron');
const viajeAsientoService = require('../service/viajeAsiento.service');

/**
 * Ejecuta la liberación de asientos vencidos
 */
const ejecutarLiberacion = async () => {
  try {
    console.log('🔄 [CRON] Ejecutando liberación de asientos vencidos...', new Date().toISOString());
    const liberados = await viajeAsientoService.liberarAsientosVencidos();
    if (liberados > 0) {
      console.log(`✅ [CRON] ${liberados} asientos liberados automáticamente`);
    }
  } catch (error) {
    console.error('❌ [CRON] Error en liberación de asientos:', error);
  }
};

/**
 * Inicia el cron job para liberar asientos cada minuto
 */
const iniciarCronJob = () => {
  // Ejecutar cada minuto (* * * * *)
  cron.schedule('* * * * *', async () => {
    await ejecutarLiberacion();
  });
  
  console.log('✅ Cron job para liberar asientos vencidos iniciado (cada 1 minuto)');
  
  // Ejecutar una vez al inicio para limpiar posibles asientos vencidos
  setTimeout(() => {
    ejecutarLiberacion();
  }, 5000);
};

module.exports = {
  iniciarCronJob,
  ejecutarLiberacion
};