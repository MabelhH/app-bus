const trackingService = require('../service/tracking.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class TrackingController {
  // Obtener última ubicación de un bus
  async getBusLocation(req, res) {
    try {
      const { busId } = req.params;
      const location = await trackingService.getLastLocation(busId);
      
      if (!location) {
        return res.status(404).json({ 
          success: false, 
          message: 'No se encontraron ubicaciones para este bus' 
        });
      }
      
      res.json({ success: true, data: location });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Obtener historial de ubicaciones
  async getLocationHistory(req, res) {
    try {
      const { busId } = req.params;
      const { hours = 24, limit = 100 } = req.query;
      
      const history = await trackingService.getLocationHistory(
        busId, 
        parseInt(hours), 
        parseInt(limit)
      );
      
      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Obtener todos los buses activos
  async getActiveBuses(req, res) {
    try {
      const { minutes = 5 } = req.query;
      const activeBuses = await trackingService.getActiveBuses(parseInt(minutes));
      
      res.json({ 
        success: true, 
        count: activeBuses.length,
        data: activeBuses 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Obtener ubicaciones de un viaje
  async getViajeLocations(req, res) {
    try {
      const { viajeId } = req.params;
      const locations = await trackingService.getViajeLocations(viajeId);
      
      res.json({ success: true, data: locations });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Obtener distancia recorrida en un viaje
  async getTripDistance(req, res) {
    try {
      const { viajeId } = req.params;
      const distance = await trackingService.calculateTripDistance(viajeId);
      
      res.json({ 
        success: true, 
        data: { 
          viajeId, 
          distanciaKm: distance.toFixed(2),
          distanciaMetros: (distance * 1000).toFixed(0)
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Actualizar ubicación (endpoint REST alternativo a Socket.IO)
  async updateLocation(req, res) {
    try {
      const { busId, latitude, longitude, speed, viajeId } = req.body;
      
      // Validar que el bus existe
      const bus = await prisma.bus.findUnique({
        where: { id: busId }
      });
      
      if (!bus) {
        return res.status(404).json({ 
          success: false, 
          message: 'Bus no encontrado' 
        });
      }
      
      const location = await trackingService.saveLocation(
        busId, 
        latitude, 
        longitude, 
        speed || 0, 
        viajeId
      );
      
      // Emitir vía WebSocket si está disponible
      if (req.io) {
        req.io.to(`bus:${busId}`).emit('bus:location-updated', {
          busId,
          latitude,
          longitude,
          speed,
          viajeId,
          timestamp: location.timestamp
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Ubicación actualizada',
        data: location 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  
  // Obtener buses cercanos
  async getNearbyBuses(req, res) {
    try {
      const { lat, lng, radius = 5 } = req.query; // radius en km
      
      if (!lat || !lng) {
        return res.status(400).json({ 
          success: false, 
          message: 'Se requieren latitud y longitud' 
        });
      }
      
      const activeBuses = await trackingService.getActiveBuses(10);
      
      // Filtrar buses por proximidad
      const nearbyBuses = activeBuses.filter(bus => {
        if (!bus.ultimaLatitud || !bus.ultimaLongitud) return false;
        
        const distance = trackingService.calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          bus.ultimaLatitud,
          bus.ultimaLongitud
        );
        
        return distance <= parseFloat(radius);
      }).map(bus => ({
        ...bus,
        distanciaKm: trackingService.calculateDistance(
          parseFloat(lat),
          parseFloat(lng),
          bus.ultimaLatitud,
          bus.ultimaLongitud
        ).toFixed(2)
      }));
      
      res.json({ 
        success: true, 
        count: nearbyBuses.length,
        data: nearbyBuses 
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  async getPublicStats(req, res) {
    try {
      const activeBusesCount = await prisma.bus.count({
        where: {
          ultimaActualizacion: {
            gte: new Date(Date.now() - (5 * 60 * 1000))
          }
        }
      });
      
      const totalUbicacionesHoy = await prisma.ubicacionBus.count({
        where: {
          timestamp: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });
      
      res.json({
        success: true,
        data: {
          busesActivos: activeBusesCount,
          actualizacionesHoy: totalUbicacionesHoy,
          ultimaActualizacion: new Date()
        }
      });
      
    } catch (error) {
      console.error('Error en getPublicStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
  // Nuevo: Obtener ubicación detallada del bus con información adicional
  async getBusLocationDetailed(req, res) {
    try {
      const { busId } = req.params;
      
      const busInfo = await prisma.bus.findUnique({
        where: { id: busId },
        include: {
          marca: { select: { nombre: true } },
          estado: { select: { nombre: true } },
          viajes: {
            where: {
              fecha: {
                gte: new Date()
              },
              estado: true
            },
            take: 1,
            include: {
              ruta: {
                select: {
                  origen: true,
                  destino: true,
                  distancia: true
                }
              }
            }
          }
        }
      });
      
      if (!busInfo) {
        return res.status(404).json({
          success: false,
          message: 'Bus no encontrado'
        });
      }
      
      const ultimaUbicacion = await prisma.ubicacionBus.findFirst({
        where: { busId },
        orderBy: { timestamp: 'desc' }
      });
      
      res.json({
        success: true,
        data: {
          bus: {
            id: busInfo.id,
            placa: busInfo.placa,
            modelo: busInfo.modelo,
            marca: busInfo.marca.nombre,
            estado: busInfo.estado.nombre
          },
          ubicacionActual: ultimaUbicacion || null,
          viajeActual: busInfo.viajes[0] || null,
          ultimaActualizacion: busInfo.ultimaActualizacion
        }
      });
      
    } catch (error) {
      console.error('Error en getBusLocationDetailed:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener la ubicación detallada',
        error: error.message
      });
    }
  }
  
  // Nuevo: Obtener todos los buses con información de viajes
  async getAllBusesWithViajes(req, res) {
    try {
      const buses = await prisma.bus.findMany({
        where: {
          estado: {
            nombre: 'Activo'
          }
        },
        include: {
          marca: { select: { nombre: true } },
          estado: { select: { nombre: true } },
          viajes: {
            where: {
              fecha: {
                gte: new Date()
              },
              estado: true
            },
            take: 2,
            orderBy: { fecha: 'asc' },
            include: {
              ruta: {
                select: {
                  origen: true,
                  destino: true,
                  precio: true
                }
              }
            }
          }
        }
      });
      
      // Para cada bus, obtener su última ubicación
      const busesConUbicacion = await Promise.all(
        buses.map(async (bus) => {
          const ultimaUbicacion = await prisma.ubicacionBus.findFirst({
            where: { busId: bus.id },
            orderBy: { timestamp: 'desc' }
          });
          
          const estaActivo = bus.ultimaActualizacion && 
            (Date.now() - new Date(bus.ultimaActualizacion).getTime()) < 5 * 60 * 1000;
          
          return {
            ...bus,
            estaActivoEnTiempoReal: estaActivo,
            ultimaUbicacion: ultimaUbicacion || null,
            tiempoSinActualizacion: bus.ultimaActualizacion ? 
              Math.floor((Date.now() - new Date(bus.ultimaActualizacion).getTime()) / 1000 / 60) : null
          };
        })
      );
      
      res.json({
        success: true,
        count: busesConUbicacion.length,
        data: busesConUbicacion,
        timestamp: new Date()
      });
      
    } catch (error) {
      console.error('Error en getAllBusesWithViajes:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los buses',
        error: error.message
      });
    }
  }
  
  // Nuevo: Limpiar ubicaciones antiguas (solo admin)
  async cleanOldLocations(req, res) {
    try {
      const { daysToKeep = 7 } = req.query;
      const cutoffDate = new Date(Date.now() - (parseInt(daysToKeep) * 24 * 60 * 60 * 1000));
      
      const deleted = await prisma.ubicacionBus.deleteMany({
        where: {
          timestamp: {
            lt: cutoffDate
          }
        }
      });
      
      res.json({
        success: true,
        message: `Se eliminaron ${deleted.count} ubicaciones anteriores a ${daysToKeep} días`,
        data: {
          eliminadas: deleted.count,
          fechaCorte: cutoffDate
        }
      });
      
    } catch (error) {
      console.error('Error en cleanOldLocations:', error);
      res.status(500).json({
        success: false,
        message: 'Error al limpiar ubicaciones antiguas',
        error: error.message
      });
    }
  }
  
  // Nuevo: Actualizar múltiples ubicaciones (batch - solo admin)
  async updateMultipleLocations(req, res) {
    try {
      const { locations } = req.body; // Array de { busId, latitude, longitude, speed, viajeId }
      
      if (!locations || !Array.isArray(locations) || locations.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere un array de ubicaciones'
        });
      }
      
      const results = [];
      const errors = [];
      
      for (const loc of locations) {
        try {
          const ubicacion = await prisma.ubicacionBus.create({
            data: {
              busId: loc.busId,
              viajeId: loc.viajeId || null,
              latitud: loc.latitude,
              longitud: loc.longitude,
              velocidad: loc.speed || 0,
              timestamp: new Date()
            }
          });
          
          await prisma.bus.update({
            where: { id: loc.busId },
            data: {
              ultimaLatitud: loc.latitude,
              ultimaLongitud: loc.longitude,
              ultimaActualizacion: new Date(),
              ...(loc.viajeId && { ultimoViajeId: loc.viajeId })
            }
          });
          
          results.push({ busId: loc.busId, success: true, ubicacionId: ubicacion.id });
        } catch (error) {
          errors.push({ busId: loc.busId, error: error.message });
        }
      }
      
      res.json({
        success: true,
        data: {
          procesados: locations.length,
          exitosos: results.length,
          errores: errors.length,
          resultados: results,
          detallesErrores: errors
        }
      });
      
    } catch (error) {
      console.error('Error en updateMultipleLocations:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar ubicaciones masivas',
        error: error.message
      });
    }
  }
  
}

module.exports = new TrackingController();