const express = require('express');
const router = express.Router();
const mercadopago = require('../config/mercadopago');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// IDs de estados (obténlos de tu base de datos)
let ESTADO_LIBRE_ID = null;
let ESTADO_RESERVADO_ID = null;
let ESTADO_OCUPADO_ID = null;
let ESTADO_PENDIENTE_PAGO_ID = null;

// Función para obtener IDs de estados
async function getEstadoIds() {
  if (!ESTADO_LIBRE_ID) {
    const estadoLibre = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: 'LIBRE' }
    });
    ESTADO_LIBRE_ID = estadoLibre?.id;
    
    const estadoReservado = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: 'RESERVADO' }
    });
    ESTADO_RESERVADO_ID = estadoReservado?.id;
    
    const estadoOcupado = await prisma.estadoviajeasiento.findFirst({
      where: { nombre: 'Ocupado' }
    });
    ESTADO_OCUPADO_ID = estadoOcupado?.id;
    
    const estadoPendiente = await prisma.estadoreserva.findFirst({
      where: { nombre: 'PENDIENTE_PAGO' }
    });
    
    if (estadoPendiente) {
      ESTADO_PENDIENTE_PAGO_ID = estadoPendiente.id;
    } else {
      const nuevoEstado = await prisma.estadoreserva.create({
        data: { nombre: 'PENDIENTE_PAGO' }
      });
      ESTADO_PENDIENTE_PAGO_ID = nuevoEstado.id;
    }
  }
}

// Crear preferencia de pago
router.post('/create-preference', async (req, res) => {
  try {
    const { 
      viajeId, 
      cantidadAsientos, 
      precioUnitario, 
      precioTotal,
      nombrePasajero,
      emailPasajero 
    } = req.body;

    console.log('📝 Creando preferencia:', { viajeId, cantidadAsientos, precioUnitario });

    await getEstadoIds();

    // Obtener el viaje
    const viaje = await prisma.viaje.findUnique({
      where: { id: viajeId },
      include: { ruta: true }
    });

    if (!viaje) {
      return res.status(404).json({
        success: false,
        message: 'Viaje no encontrado'
      });
    }

    // Obtener un usuario (temporal - deberías usar el usuario logueado)
    const user = await prisma.user.findFirst();
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'No hay usuarios registrados'
      });
    }
    let asientosParaReservar = [];

    // Buscar asientos LIBRES para este viaje
    const asientosDisponibles = await prisma.viaje_asiento.findMany({
      where: {
        viajeId: viajeId,
        estadoId: ESTADO_LIBRE_ID
      },
      take: parseInt(cantidadAsientos),
      include: { asiento: true }
    });

    if (asientosDisponibles.length < cantidadAsientos) {
      return res.status(400).json({
        success: false,
        message: `No hay suficientes asientos disponibles. Disponibles: ${asientosDisponibles.length}`
      });
    }

    // Crear reserva
    const reserva = await prisma.reserva.create({
      data: {
        userId: user.id,
        viajeId: viajeId,
        estadoId: ESTADO_PENDIENTE_PAGO_ID,
      }
    });

    // Reservar los asientos
    for (const asiento of asientosDisponibles) {
      await prisma.viaje_asiento.update({
        where: { id: asiento.id },
        data: {
          estadoId: ESTADO_RESERVADO_ID,
          reservadoHasta: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
          reservadoPor: user.id,
          reservaId: reserva.id,
        }
      });
    }
    const preference = {
      items: [
        {
          id: viajeId,
          title: `${viaje.ruta?.origen || 'Origen'} → ${viaje.ruta?.destino || 'Destino'}`,
          description: `${cantidadAsientos} asiento(s) - ${nombrePasajero || 'Cliente'}`,
          quantity: parseInt(cantidadAsientos),
          unit_price: parseFloat(precioUnitario),
          currency_id: 'PEN',
        },
      ],
      external_reference: String(reserva.id),  // ✅ Solo el ID de la reserva
      back_urls: {
        success: 'https://drove-backboard-water.ngrok-free.dev/api/pago/pago-success',
        failure: 'https://drove-backboard-water.ngrok-free.dev/api/pago/pago-failure',
        pending: 'https://drove-backboard-water.ngrok-free.dev/api/pago/pago-pendiente'
      },
      auto_return: 'approved',
      payment_methods: {
        excluded_payment_methods: [],
        excluded_payment_types: [
          { id: "atm" },
          { id: "ticket" }
        ],
        installments: 1,
        default_installments: 1
      },
    };

    if (nombrePasajero || emailPasajero) {
      preference.payer = {
        name: nombrePasajero || 'Usuario',
        email: emailPasajero || 'usuario@email.com',
      };
    }

    const response = await mercadopago.preferences.create(preference);
    
    console.log('✅ Preferencia creada:', response.body.id);
    console.log('🔗 Link de pago:', response.body.init_point);
    res.json({
      success: true,
      preference: {
        id: response.body.id,
        init_point: response.body.sandbox_init_point || response.body.init_point,
        sandbox_init_point: response.body.sandbox_init_point,
      },
      isSandbox: true,
      message: 'Modo de pruebas - Usa tarjeta de prueba'
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


router.post('/webhook', async (req, res) => {
  try {
    console.log('🔔 Webhook recibido:', req.body);
    
    const { type, data } = req.body;
    
    if (type === 'payment') {
      const paymentId = data.id;
      const payment = await mercadopago.payment.findById(paymentId);
      
      if (payment.body.status === 'approved') {
        const reservaId = payment.body.external_reference;
        console.log('✅ Pago aprobado para reserva:', reservaId);
        
        await getEstadoIds();
        
        // ✅ Obtener el estado OCUPADO
        const estadoOcupado = await prisma.estadoviajeasiento.findFirst({
          where: { nombre: 'OCUPADO' }
        });
        
        if (!estadoOcupado) {
          console.error('❌ Estado OCUPADO no encontrado');
          return res.status(200).send('OK');
        }
        
        // ✅ Actualizar asientos de esta reserva a OCUPADO
        await prisma.viaje_asiento.updateMany({
          where: {
            reservaId: reservaId
          },
          data: {
            estadoId: estadoOcupado.id,
            reservadoHasta: null,
            reservadoPor: null
          }
        });
        
        // ✅ Actualizar estado de la reserva
        const estadoConfirmada = await prisma.estadoreserva.findFirst({
          where: { nombre: 'CONFIRMADA' }
        });
        
        if (estadoConfirmada) {
          await prisma.reserva.update({
            where: { id: reservaId },
            data: { estadoId: estadoConfirmada.id }
          });
        }
        
        console.log('✅ Asientos y reserva actualizados correctamente');
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).send('Error');
  }
});

// Verificar estado de pago
router.get('/status/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const response = await mercadopago.payment.findById(paymentId);
    
    console.log(`🔍 Estado del pago ${paymentId}: ${response.body.status}`);
    
    res.json({
      success: true,
      status: response.body.status,
      message: response.body.status_detail,
      payment: response.body
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;