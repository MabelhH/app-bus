// backend/routes/ticket.js
const express = require("express");
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const mercadopago = require('../config/mercadopago'); // Importar la configuración

// Función para generar código único de boleto
function generarCodigoBoleto() {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `BOL-${año}${mes}${dia}-${random}`;
}

// ========== WEBHOOK DE MERCADO PAGO ==========
router.post('/webhook', async (req, res) => {
    try {
        const { type, data } = req.body;
        console.log('📥 Webhook recibido:', { type, data });
        
        if (type === 'payment') {
            const paymentId = data.id;
            const payment = await mercadopago.payment.findById(paymentId);
            
            if (payment.body.status === 'approved') {
                const reservaId = payment.body.external_reference;
                console.log('✅ Pago aprobado para reserva:', reservaId);
                
                // Obtener el estado OCUPADO
                const estadoOcupado = await prisma.estadoviajeasiento.findFirst({
                    where: { nombre: 'OCUPADO' }
                });
                
                if (estadoOcupado) {
                    // Actualizar el estado del asiento a OCUPADO
                    await prisma.viaje_asiento.updateMany({
                        where: { reservaId: reservaId },
                        data: { estadoId: estadoOcupado.id }
                    });
                }
                
                // Actualizar estado de la reserva a CONFIRMADA
                const estadoConfirmada = await prisma.estadoreserva.findFirst({
                    where: { nombre: 'CONFIRMADA' }
                });
                
                if (estadoConfirmada) {
                    await prisma.reserva.update({
                        where: { id: reservaId },
                        data: { estadoId: estadoConfirmada.id }
                    });
                }
                
                // Obtener los asientos de la reserva
                const viajeAsientos = await prisma.viaje_asiento.findMany({
                    where: { reservaId: reservaId },
                    include: { asiento: true }
                });
                
                // Crear boletos para cada asiento
                const boletosCreados = [];
                
                for (const viajeAsiento of viajeAsientos) {
                    // Verificar si ya existe un boleto
                    const boletoExistente = await prisma.boleto.findFirst({
                        where: {
                            reservaId: reservaId,
                            asientoId: viajeAsiento.asientoId
                        }
                    });
                    
                    if (!boletoExistente) {
                        const nuevoBoleto = await prisma.boleto.create({
                            data: {
                                codigo: generarCodigoBoleto(),
                                reservaId: reservaId,
                                asientoId: viajeAsiento.asientoId
                            }
                        });
                        boletosCreados.push(nuevoBoleto);
                        console.log(`✅ Boleto creado: ${nuevoBoleto.codigo} - Asiento: ${viajeAsiento.asiento.numeroAsiento}`);
                    } else {
                        boletosCreados.push(boletoExistente);
                        console.log(`📄 Boleto ya existente: ${boletoExistente.codigo}`);
                    }
                }
                
                // Responder con éxito
                res.status(200).json({
                    success: true,
                    message: 'Pago procesado correctamente',
                    reservaId: reservaId,
                    boletoId: boletosCreados[0]?.id || null,
                    boletos: boletosCreados.map(b => ({
                        id: b.id,
                        codigo: b.codigo
                    }))
                });
                
            } else {
                console.log(`⚠️ Pago no aprobado. Estado: ${payment.body.status}`);
                res.status(200).json({ 
                    success: false, 
                    message: `Pago en estado: ${payment.body.status}` 
                });
            }
        } else {
            res.status(200).json({ message: 'Webhook recibido', type: type });
        }
        
    } catch (error) {
        console.error('❌ Error en webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== OBTENER BOLETO POR PAYMENT ID ==========
router.get('/api/ticket/by-payment/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        
        // Buscar el pago en MercadoPago
        const payment = await mercadopago.payment.findById(paymentId);
        
        if (!payment || !payment.body) {
            return res.json({ boletoId: null, error: 'Pago no encontrado' });
        }
        
        const reservaId = payment.body.external_reference;
        
        if (!reservaId) {
            return res.json({ boletoId: null, error: 'Reserva no asociada' });
        }
        
        // Buscar el boleto asociado a la reserva
        const boleto = await prisma.boleto.findFirst({
            where: { reservaId: reservaId },
            orderBy: { createdAt: 'asc' }
        });
        
        if (boleto) {
            res.json({ 
                boletoId: boleto.id,
                reservaId: reservaId,
                codigo: boleto.codigo
            });
        } else {
            res.json({ boletoId: null, reservaId: reservaId });
        }
        
    } catch (error) {
        console.error('Error en by-payment:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== OBTENER DATOS COMPLETOS DEL BOLETO ==========
router.get('/api/ticket/boleto/:boletoId', async (req, res) => {
    try {
        const { boletoId } = req.params;
        
        const boleto = await prisma.boleto.findUnique({
            where: { id: boletoId },
            include: {
                reserva: {
                    include: {
                        user: true,
                        viaje: {
                            include: {
                                bus: true,
                                ruta: true
                            }
                        }
                    }
                },
                asiento: true
            }
        });
        
        if (!boleto) {
            return res.status(404).json({ error: 'Boleto no encontrado' });
        }
        
        res.json(boleto);
        
    } catch (error) {
        console.error('Error en boleto:', error);
        res.status(500).json({ error: error.message });
    }
});

// ========== VERIFICAR BOLETO POR CÓDIGO (para el bus) ==========
router.get('/api/ticket/verify/:codigo', async (req, res) => {
    try {
        const { codigo } = req.params;
        
        const boleto = await prisma.boleto.findUnique({
            where: { codigo: codigo },
            include: {
                reserva: {
                    include: {
                        user: true,
                        viaje: {
                            include: {
                                bus: true,
                                ruta: true
                            }
                        }
                    }
                },
                asiento: true
            }
        });
        
        if (!boleto) {
            return res.status(404).json({ 
                valid: false, 
                message: 'Boleto no encontrado' 
            });
        }
        
        // Verificar si el viaje aún no ha pasado
        const ahora = new Date();
        const fechaViaje = new Date(boleto.reserva.viaje.fecha);
        const [hora, minuto] = boleto.reserva.viaje.hora.split(':');
        fechaViaje.setHours(parseInt(hora), parseInt(minuto));
        
        const esValido = fechaViaje > ahora;
        
        res.json({
            valid: esValido,
            boleto: {
                codigo: boleto.codigo,
                pasajero: `${boleto.reserva.user.name} ${boleto.reserva.user.apellido}`,
                asiento: boleto.asiento.numeroAsiento,
                ruta: `${boleto.reserva.viaje.ruta.origen} - ${boleto.reserva.viaje.ruta.destino}`,
                fecha: boleto.reserva.viaje.fecha,
                hora: boleto.reserva.viaje.hora
            }
        });
        
    } catch (error) {
        console.error('Error en verify:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;