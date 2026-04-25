


// services/tracking.service.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularDistancia } = require('./ubicacionBus.service');


class TrackingService {
  constructor() {
    // Almacena notificaciones enviadas para evitar duplicados
    // Formato: { trackingId: { usuarios: Set, timestamp: number } }
    this.notificacionesEnviadas = new Map();
  }

  // Guardar ubicación de un bus
  async saveLocation(busId, latitude, longitude, speed = 0, viajeId = null) {
    try {
      const ubicacion = await prisma.ubicacionBus.create({
        data: {
          busId,
          viajeId,
          latitud: latitude,
          longitud: longitude,
          velocidad: speed
        }
      });

      await prisma.bus.update({
        where: { id: busId },
        data: {
          ultimaLatitud: latitude,
          ultimaLongitud: longitude,
          ultimaActualizacion: new Date(),
          ultimoViajeId: viajeId
        }
      });

      if (viajeId) {
        await this.verificarCercania(viajeId, latitude, longitude, busId);
      }

      return ubicacion;
    } catch (error) {
      console.error('Error guardando ubicación:', error);
      throw error;
    }
  }

  // Notificar a usuarios con reserva en el viaje
  async notificarUsuarios(reservas, mensaje, codigoTipo, viajeId, busId, ubicacionActual = null,extraData = {}) {
    try {
      const tipo = await prisma.tipo_notificacion.findFirst({
        where: { codigo: codigoTipo }
      });

      if (!tipo) {
        console.log("❌ Tipo no encontrado:", codigoTipo);
        return;
      }

      const trackingId = `${viajeId}-${codigoTipo}`;

      if (!this.notificacionesEnviadas.has(trackingId)) {
        this.notificacionesEnviadas.set(trackingId, {
          usuarios: new Set(),
          timestamp: Date.now()
        });
      }

      const notificados = this.notificacionesEnviadas.get(trackingId).usuarios;

      for (const reserva of reservas) {
        const userKey = `${reserva.userId}`;

        if (!notificados.has(userKey)) {
          const existe = await prisma.notificacion.findFirst({
            where: {
              userId: reserva.userId,
              tipoId: tipo.id,
              createdAt: {
                gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24 horas
              }
            }
          });

          if (!existe) {
            await prisma.notificacion.create({
              data: {
                mensaje,
                userId: reserva.userId,
                tipoId: tipo.id,
                metadata: {
                  viajeId,
                  busId,
                  ...extraData
                } 
              }
            });
            notificados.add(userKey);
            console.log(`✅ Notificación a usuario ${reserva.userId}: ${mensaje}`);
          }
        }
      }
    } catch (error) {
      console.error("Error notificando usuarios:", error);
    }
  }


async verificarCercania(viajeId, lat, lng, busId) {
  try {
    const viaje = await prisma.viaje.findUnique({
      where: { id: viajeId },
      include: {
        ruta: {
          include: {
            paradas: { orderBy: { orden: 'asc' } }
          }
        },
        reservas: { include: { user: true } }
      }
    });

    if (!viaje || !viaje.ruta) return;

    const paradas = viaje.ruta.paradas || [];
    if (paradas.length === 0) return;

    const origen = paradas[0];           // Primera parada
    const destino = paradas[paradas.length - 1]; // Última parada
    const paradasIntermedias = paradas.slice(1, -1);

    const progreso = await this.calcularProgresoViaje(viajeId, lat, lng);

    // Calcular distancias
    const distanciaOrigen = calcularDistancia(lat, lng, origen.latitud, origen.longitud);
    const distanciaDestino = calcularDistancia(lat, lng, destino.latitud, destino.longitud);

    // Obtener ubicación anterior para detectar INICIO
    const ubicacionesRecientes = await prisma.ubicacionBus.findMany({
      where: { busId, viajeId },
      orderBy: { timestamp: 'desc' },
      take: 2
    });
    const ubicacionAnterior = ubicacionesRecientes.length > 1 ? ubicacionesRecientes[1] : null;

    // ============================================
    // 1. ORIGEN - Llegada al punto de embarque
    // ============================================
    const keyOrigen = `${viajeId}-ORIGEN`;
    if (distanciaOrigen < 0.3 && !this.notificacionesEnviadas.has(keyOrigen)) {
      await this.notificarUsuarios(
        viaje.reservas,
        `🚍 El bus ha llegado a ${origen.nombre}. Abordaje disponible.`,
        "ORIGEN",
        viajeId,
        busId,
        { parada: origen.nombre, distancia: distanciaOrigen },
        {
          progreso: progreso.progreso,
          distanciaRestante: progreso.distanciaRestante
        }
      );
      this.notificacionesEnviadas.set(keyOrigen, { timestamp: Date.now() });
      console.log(`✅ ORIGEN: ${origen.nombre}`);
    }

    // ============================================
    // 2. INICIO - Inicio del viaje (salió del terminal)
    // ============================================
    const keyInicio = `${viajeId}-INICIO`;
    if (ubicacionAnterior && !this.notificacionesEnviadas.has(keyInicio)) {
      const distanciaAnteriorOrigen = calcularDistancia(
        ubicacionAnterior.latitud,
        ubicacionAnterior.longitud,
        origen.latitud,
        origen.longitud
      );
      
      // Si antes estaba cerca (<200m) y ahora está más lejos (>400m)
      if (distanciaAnteriorOrigen < 0.2 && distanciaOrigen > 0.4) {
        const siguiente = paradas[1]?.nombre || destino.nombre;
        await this.notificarUsuarios(
          viaje.reservas,
          `🚌 Viaje iniciado: ${origen.nombre} → ${destino.nombre}. Próxima: ${siguiente}. ¡Buen viaje!`,
          "INICIO",
          viajeId,
          busId,
          { origen: origen.nombre, destino: destino.nombre, siguienteParada: siguiente },
          {
            progreso: progreso.progreso,
            distanciaRestante: progreso.distanciaRestante
          }
        );
        this.notificacionesEnviadas.set(keyInicio, { timestamp: Date.now() });
        console.log(`✅ INICIO: Viaje comenzado`);
      }
    }

    // ============================================
    // 3. PARADA - Paso por parada intermedia
    // ============================================
    for (const parada of paradasIntermedias) {
      const keyParada = `${viajeId}-PARADA-${parada.id}`;
      if (!this.notificacionesEnviadas.has(keyParada)) {
        const distanciaParada = calcularDistancia(lat, lng, parada.latitud, parada.longitud);
        if (distanciaParada < 0.2) {
          const siguiente = this.getSiguienteParada(paradas, parada.orden)?.nombre || destino.nombre;
          await this.notificarUsuarios(
            viaje.reservas,
            `📍 Llegando a: ${parada.nombre}. Próxima: ${siguiente}`,
            "PARADA",
            viajeId,
            busId,
            { parada: parada.nombre, siguienteParada: siguiente, distancia: distanciaParada },
            {
              progreso: progreso.progreso,
              distanciaRestante: progreso.distanciaRestante
            }
          );
          this.notificacionesEnviadas.set(keyParada, { timestamp: Date.now() });
          console.log(`✅ PARADA: ${parada.nombre}`);
          break;
        }
      }
    }

    // ============================================
    // 4. DESTINO - Llegada al destino final
    // ============================================
    const keyDestino = `${viajeId}-DESTINO`;
    if (distanciaDestino < 0.3 && !this.notificacionesEnviadas.has(keyDestino)) {
      await this.notificarUsuarios(
        viaje.reservas,
        `🏁 Llegando a ${destino.nombre}. ¡Gracias por viajar con nosotros!`,
        "DESTINO",
        viajeId,
        busId,
        { destino: destino.nombre, distancia: distanciaDestino },
        {
          progreso: 100,
          distanciaRestante: 0
        }
      );
      this.notificacionesEnviadas.set(keyDestino, { timestamp: Date.now() });
      console.log(`✅ DESTINO: ${destino.nombre}`);
    }

    this.limpiarNotificacionesAntiguas();

  } catch (error) {
    console.error('Error:', error);
  }
}

getSiguienteParada(paradas, ordenActual) {
  return paradas.find(p => p.orden === ordenActual + 1);
}

  // Limpiar notificaciones antiguas (cada 2 horas)
  limpiarNotificacionesAntiguas() {
    const ahora = Date.now();
    for (const [key, value] of this.notificacionesEnviadas.entries()) {
      if (ahora - value.timestamp > 7200000) { // 2 horas
        this.notificacionesEnviadas.delete(key);
      }
    }
  }

  // Obtener última ubicación de un bus
  async getLastLocation(busId) {
    try {
      const ubicacion = await prisma.ubicacionBus.findFirst({
        where: { busId },
        orderBy: { timestamp: 'desc' },
        include: {
          bus: {
            select: { placa: true, modelo: true }
          },
          viaje: {
            select: {
              id: true,
              ruta: { select: { origen: true, destino: true } }
            }
          }
        }
      });
      return ubicacion;
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      throw error;
    }
  }

  // Obtener historial de ubicaciones de un bus
  async getLocationHistory(busId, hours = 24, limit = 100) {
    try {
      const ubicaciones = await prisma.ubicacionBus.findMany({
        where: {
          busId,
          timestamp: { gte: new Date(Date.now() - (hours * 60 * 60 * 1000)) }
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      });
      return ubicaciones;
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      throw error;
    }
  }

  // Obtener todos los buses activos (con actualización reciente)
  async getActiveBuses(minutesAgo = 5) {
    try {
      const cutoffTime = new Date(Date.now() - (minutesAgo * 60 * 1000));
      console.log('⏱️ cutoffTime (UTC):', cutoffTime.toISOString());
      console.log('⏱️ Ahora (UTC):', new Date().toISOString());
      const activeBuses = await prisma.bus.findMany({
        where: {
          ultimaActualizacion: { gte: cutoffTime },
          estado: { nombre: 'ACTIVO' }
        },
        include: {
          marca: true,
          estado: true,
          viajes: {
            where: { fecha: { gte: new Date() }, estado: true },
            take: 1,
            include: { ruta: true }
          }
        }
      });
      return activeBuses.map(bus => ({
        id: bus.id,
        placa: bus.placa,
        modelo: bus.modelo,
        ultimaLatitud: bus.ultimaLatitud,
        ultimaLongitud: bus.ultimaLongitud,
        ultimaActualizacion: bus.ultimaActualizacion,
        viajeActual: bus.viajes[0] || null,
        marca: bus.marca.nombre
      }));
    } catch (error) {
      console.error('Error obteniendo buses activos:', error);
      throw error;
    }
  }

  // Obtener ubicaciones de un viaje específico
  async getViajeLocations(viajeId) {
    try {
      const ubicaciones = await prisma.ubicacionBus.findMany({
        where: { viajeId },
        orderBy: { timestamp: 'asc' }
      });
      return ubicaciones;
    } catch (error) {
      console.error('Error obteniendo ubicaciones del viaje:', error);
      throw error;
    }
  }

  // Calcular distancia recorrida en un viaje
  async calculateTripDistance(viajeId) {
    try {
      const ubicaciones = await prisma.ubicacionBus.findMany({
        where: { viajeId },
        orderBy: { timestamp: 'asc' }
      });
      if (ubicaciones.length < 2) return 0;
      let totalDistance = 0;
      for (let i = 1; i < ubicaciones.length; i++) {
        const prev = ubicaciones[i - 1];
        const curr = ubicaciones[i];
        totalDistance += this.calculateDistance(
          prev.latitud, prev.longitud,
          curr.latitud, curr.longitud
        );
      }
      return totalDistance;
    } catch (error) {
      console.error('Error calculando distancia:', error);
      throw error;
    }
  }

  // Calcular distancia entre dos puntos (Haversine)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  deg2rad(deg) {
    return deg * (Math.PI / 180);
  }

  // Limpiar ubicaciones antiguas (para jobs programados)
  async cleanOldLocations(daysToKeep = 7) {
    try {
      const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000));
      const deleted = await prisma.ubicacionBus.deleteMany({
        where: { timestamp: { lt: cutoffDate } }
      });
      console.log(`🗑️ Limpiadas ${deleted.count} ubicaciones antiguas`);
      return deleted.count;
    } catch (error) {
      console.error('Error limpiando ubicaciones:', error);
      throw error;
    }
  }

  // Obtener paradas de una ruta
  async getParadasByRuta(rutaId) {
    try {
      const paradas = await prisma.parada.findMany({
        where: { rutaId },
        orderBy: { orden: 'asc' }
      });
      return paradas;
    } catch (error) {
      console.error('Error obteniendo paradas:', error);
      throw error;
    }
  }

  // Registrar una nueva parada en una ruta
  async registrarParada(rutaId, nombre, latitud, longitud, orden) {
    try {
      const parada = await prisma.parada.create({
        data: { rutaId, nombre, latitud, longitud, orden }
      });
      return parada;
    } catch (error) {
      console.error('Error registrando parada:', error);
      throw error;
    }
  }
  async calcularProgresoViaje(viajeId, lat, lng) {
  const paradas = await prisma.parada.findMany({
    where: { rutaId: (await prisma.viaje.findUnique({
      where: { id: viajeId }
    })).rutaId },
    orderBy: { orden: 'asc' }
  });

  let distanciaTotal = 0;
  let distanciaRecorrida = 0;

  for (let i = 1; i < paradas.length; i++) {
    const prev = paradas[i - 1];
    const curr = paradas[i];

    const tramo = calcularDistancia(
      prev.latitud, prev.longitud,
      curr.latitud, curr.longitud
    );

    distanciaTotal += tramo;
  }

  // Distancia actual al destino
  const destino = paradas[paradas.length - 1];

  const distanciaRestante = calcularDistancia(
    lat, lng,
    destino.latitud,
    destino.longitud
  );

  const progresoRaw = ((distanciaTotal - distanciaRestante) / distanciaTotal) * 100;

  return {
    distanciaTotal,
    distanciaRestante,
    progreso: Math.max(0, Math.min(100, progresoRaw))
  };
}
}



module.exports = new TrackingService();