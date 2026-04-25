const { PrismaClient } = require("@prisma/client");
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log("Insertando datos iniciales...");
  const hashedPassword = await bcrypt.hash("123456", 10);

  // ROLES
  const adminRol = await prisma.rol.upsert({
    where: { name: "ADMIN" },
    update: {},
    create: { name: "ADMIN" },
  });

  const clienteRol = await prisma.rol.upsert({
    where: { name: "CLIENTE" },
    update: {},
    create: { name: "CLIENTE" },
  });

  // ESTADO USUARIO
  const activo = await prisma.estadousuario.upsert({
    where: { nombre: "ACTIVO" },
    update: {},
    create: { nombre: "ACTIVO" },
  });

  const inactivo = await prisma.estadousuario.upsert({
    where: { nombre: "INACTIVO" },
    update: {},
    create: { nombre: "INACTIVO" },
  });

  // ESTADO BUS
  const busActivo = await prisma.estadobus.upsert({
    where: { nombre: "OPERATIVO" },
    update: {},
    create: { nombre: "OPERATIVO" },
  });

  const busMantenimiento = await prisma.estadobus.upsert({
    where: { nombre: "MANTENIMIENTO" },
    update: {},
    create: { nombre: "MANTENIMIENTO" },
  });

  // ESTADO VIAJE
  const viajeProgramado = await prisma.estadoviaje.upsert({
    where: { nombre: "PROGRAMADO" },
    update: {},
    create: { nombre: "PROGRAMADO" },
  });

  const viajeFinalizado = await prisma.estadoviaje.upsert({
    where: { nombre: "FINALIZADO" },
    update: {},
    create: { nombre: "FINALIZADO" },
  });

  // ESTADO ASIENTO
  const asientoLibre = await prisma.estadoviajeasiento.upsert({
    where: { nombre: "LIBRE" },
    update: {},
    create: { nombre: "LIBRE" },
  });

  const asientoReservado = await prisma.estadoviajeasiento.upsert({
    where: { nombre: "RESERVADO" },
    update: {},
    create: { nombre: "RESERVADO" },
  });

  await prisma.estadoviajeasiento.upsert({
    where: { nombre: "OCUPADO" },
    update: {},
    create: { nombre: "OCUPADO" },
  });

  // ESTADO RESERVA
  const reservaActiva = await prisma.estadoreserva.upsert({
    where: { nombre: "ACTIVA" },
    update: {},
    create: { nombre: "ACTIVA" },
  });

  const reservaCancelada = await prisma.estadoreserva.upsert({
    where: { nombre: "CANCELADA" },
    update: {},
    create: { nombre: "CANCELADA" },
  });

  await prisma.estadoreserva.upsert({
    where: { nombre: "PENDIENTE_PAGO" },
    update: {},
    create: { nombre: "PENDIENTE_PAGO" },
  });

  await prisma.estadoreserva.upsert({
    where: { nombre: "CONFIRMADA" },
    update: {},
    create: { nombre: "CONFIRMADA" },
  });

  // METODO PAGO
  const efectivo = await prisma.metodopago.upsert({
    where: { nombre: "EFECTIVO" },
    update: {},
    create: { nombre: "EFECTIVO" },
  });

  const tarjeta = await prisma.metodopago.upsert({
    where: { nombre: "TARJETA" },
    update: {},
    create: { nombre: "TARJETA" },
  });

  // TIPO OCURRENCIA
  const retraso = await prisma.tipoocurrencia.upsert({
    where: { nombre: "RETRASO" },
    update: {},
    create: { nombre: "RETRASO" },
  });

  const accidente = await prisma.tipoocurrencia.upsert({
    where: { nombre: "ACCIDENTE" },
    update: {},
    create: { nombre: "ACCIDENTE" },
  });

  // ESTADO OCURRENCIA
  const pendiente = await prisma.estadoocurrencia.upsert({
    where: { nombre: "PENDIENTE" },
    update: {},
    create: { nombre: "PENDIENTE" },
  });

  const resuelto = await prisma.estadoocurrencia.upsert({
    where: { nombre: "RESUELTO" },
    update: {},
    create: { nombre: "RESUELTO" },
  });

  // MARCA BUS
  const marcaVolvo = await prisma.marca.findFirst({ where: { nombre: "Volvo" } });
  const volvo = marcaVolvo || await prisma.marca.create({ data: { nombre: "Volvo" } });

  const marcaMercedes = await prisma.marca.findFirst({ where: { nombre: "Mercedes Benz" } });
  const mercedes = marcaMercedes || await prisma.marca.create({ data: { nombre: "Mercedes Benz" } });

  // BUS
  const bus1 = await prisma.bus.upsert({
    where: { placa: "ABC-123" },
    update: {},
    create: {
      placa: "ABC-123",
      modelo: "2022",
      capacidad: 40,
      marcaId: volvo.id,
      estadoId: busActivo.id,
    },
  });

  // ASIENTOS
  for (let i = 1; i <= 40; i++) {
    await prisma.asiento.upsert({
      where: {
        busId_numeroAsiento: {
          busId: bus1.id,
          numeroAsiento: i,
        },
      },
      update: {},
      create: {
        busId: bus1.id,
        numeroAsiento: i,
      },
    });
  }

  // RUTA
  let ruta1 = await prisma.ruta.findFirst({
    where: { origen: "Arequipa", destino: "Pedregal" },
  });
  if (!ruta1) {
    ruta1 = await prisma.ruta.create({
      data: {
        origen: "Arequipa",
        destino: "Pedregal",
        distancia: 120,
        precio: 35,
      },
    });
  }

  // USUARIO ADMIN
  const admin = await prisma.user.upsert({
    where: { email: "admin@test.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@test.com",
      name: "Admin",
      apellido: "Sistema",
      password: hashedPassword,
      telefono: "999888777",
      dni: "12345678",
      idrol: adminRol.id,
      estadoId: activo.id,
    },
  });

  // USUARIO CLIENTE
  const cliente = await prisma.user.upsert({
    where: { email: "cliente@test.com" },
    update: { password: hashedPassword },
    create: {
      email: "cliente@test.com",
      name: "Juan",
      apellido: "Perez",
      password: hashedPassword,
      telefono: "987654321",
      dni: "87654321",
      idrol: clienteRol.id,
      estadoId: activo.id,
    },
  });

  // VIAJE
  // For Trips, since there's no easy unique constraint other than ID, we'll check if a trip for this route/bus/date exists
  const today = new Date();
  today.setHours(8, 0, 0, 0);

  let viaje1 = await prisma.viaje.findFirst({
    where: {
      busId: bus1.id,
      rutaId: ruta1.id,
      hora: "08:00",
    },
  });

  if (!viaje1) {
    viaje1 = await prisma.viaje.create({
      data: {
        fecha: new Date(),
        hora: "08:00",
        busId: bus1.id,
        rutaId: ruta1.id,
        idEstadoViaje: viajeProgramado.id,
      },
    });
  }

  // ASIENTOS DEL VIAJE
  const asientos = await prisma.asiento.findMany({
    where: { busId: bus1.id },
  });

  for (const a of asientos) {
    await prisma.viaje_asiento.upsert({
      where: {
        viajeId_asientoId: {
          viajeId: viaje1.id,
          asientoId: a.id,
        },
      },
      update: {},
      create: {
        viajeId: viaje1.id,
        asientoId: a.id,
        estadoId: asientoLibre.id,
      },
    });
  }

  // VIAJE 2 (CON ASIENTOS OCUPADOS)
  let viaje2 = await prisma.viaje.findFirst({
    where: {
      busId: bus1.id,
      rutaId: ruta1.id,
      hora: "14:00",
    },
  });

  if (!viaje2) {
    viaje2 = await prisma.viaje.create({
      data: {
        fecha: new Date(),
        hora: "14:00",
        busId: bus1.id,
        rutaId: ruta1.id,
        idEstadoViaje: viajeProgramado.id,
      },
    });
  }

  // ASIENTOS DEL VIAJE 2
  for (const a of asientos) {
    // Marcamos los asientos 1, 2 y 3 como RESERVADOS
    const estadoAsiento = (a.numeroAsiento <= 3) ? asientoReservado.id : asientoLibre.id;

    await prisma.viaje_asiento.upsert({
      where: {
        viajeId_asientoId: {
          viajeId: viaje2.id,
          asientoId: a.id,
        },
      },
      update: {
        estadoId: estadoAsiento
      },
      create: {
        viajeId: viaje2.id,
        asientoId: a.id,
        estadoId: estadoAsiento,
      },
    });
  }

  console.log("SEED COMPLETADO");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });