// test-ticket.js - Ejecuta con: node test-ticket.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testTicket() {
    try {
        console.log('🧪 Probando generación de ticket...\n');
        
        // 1. Buscar una reserva existente (CONFIRMADA o PENDIENTE)
        const reserva = await prisma.reserva.findFirst({
            include: {
                viaje: {
                    include: {
                        bus: true,
                        ruta: true
                    }
                },
                user: true,
                boletos: true
            }
        });
        
        if (!reserva) {
            console.log('❌ No hay reservas en la base de datos');
            return;
        }
        
        console.log('📋 Reserva encontrada:');
        console.log(`   ID: ${reserva.id}`);
        console.log(`   Usuario: ${reserva.user.name} ${reserva.user.apellido}`);
        console.log(`   Ruta: ${reserva.viaje.ruta.origen} → ${reserva.viaje.ruta.destino}`);
        console.log(`   Boletos existentes: ${reserva.boletos.length}\n`);
        
        // 2. Verificar si ya tiene boletos
        if (reserva.boletos.length > 0) {
            console.log('✅ Ya existen boletos para esta reserva:');
            reserva.boletos.forEach(b => {
                console.log(`   - Código: ${b.codigo}, Asiento: ${b.asientoId}`);
            });
        } else {
            console.log('⚠️ No hay boletos. Creando uno de prueba...\n');
            
            // 3. Buscar un asiento de la reserva
            const viajeAsiento = await prisma.viaje_asiento.findFirst({
                where: { reservaId: reserva.id },
                include: { asiento: true }
            });
            
            if (viajeAsiento) {
                // 4. Crear boleto de prueba
                const codigo = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const nuevoBoleto = await prisma.boleto.create({
                    data: {
                        codigo: codigo,
                        reservaId: reserva.id,
                        asientoId: viajeAsiento.asientoId
                    }
                });
                
                console.log('✅ Boleto creado exitosamente:');
                console.log(`   ID: ${nuevoBoleto.id}`);
                console.log(`   Código: ${nuevoBoleto.codigo}`);
                console.log(`   Asiento: ${viajeAsiento.asiento.numeroAsiento}`);
                
                // 5. Mostrar URL para ver el ticket
                console.log('\n🔗 Para ver el ticket, abre en tu navegador:');
                console.log(`   http://192.168.5.101:3000/ticket?id=${nuevoBoleto.id}`);
            } else {
                console.log('❌ No se encontró asiento asociado a esta reserva');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

testTicket();