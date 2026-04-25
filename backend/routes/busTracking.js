const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const trackingService = require('../service/tracking.service');

console.log('🔄 Rutas de tracking cargadas');

// ✅ Ruta de prueba
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Rutas de tracking funcionando',
    timestamp: new Date()
  });
});

// ✅ Obtener buses
router.get('/active', async (req, res) => {
  try {
    const buses = await trackingService.getActiveBuses(5);

    res.json({
      success: true,
      count: buses.length,
      data: buses
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ Obtener bus por ID
router.get('/bus/:busId', async (req, res) => {
  try {
    const { busId } = req.params;

    const bus = await prisma.bus.findUnique({
      where: { id: busId },
      include: {
        marca: { select: { nombre: true } },
        estado: { select: { nombre: true } }
      }
    });

    if (!bus) {
      return res.status(404).json({
        success: false,
        message: 'Bus no encontrado'
      });
    }

    const ultimaUbicacion = await prisma.ubicacionBus.findFirst({
      where: { busId },
      orderBy: { timestamp: 'desc' }
    });

    const progreso = bus.ultimoViajeId
    ? await trackingService.calcularProgresoViaje(
        bus.ultimoViajeId,
        bus.ultimaLatitud,
        bus.ultimaLongitud
      )
    : null;

    res.json({
      success: true,
      data: {
        ...bus,
        ultimaUbicacion,
        progreso
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ ACTUALIZAR UBICACIÓN (IMPORTANTE)
router.post('/location', async (req, res) => {
  try {
    const { busId, latitude, longitude, speed, viajeId } = req.body;

    if (!busId || latitude === undefined || longitude === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos'
      });
    }

    // 🔥 LLAMAS TU SERVICIO (esto dispara notificaciones)
    await trackingService.saveLocation(
      busId,
      latitude,
      longitude,
      speed || 0,
      viajeId || null
    );

    res.json({
      success: true,
      message: 'Ubicación guardada + notificaciones ejecutadas'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;