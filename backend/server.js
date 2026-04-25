require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http"); 
const { Server } = require('socket.io');
const { PrismaClient } = require("@prisma/client");

const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
const API_URL = process.env.API_URL || BASE_URL;
const EXPO_URL = process.env.EXPO_URL || `exp://${new URL(BASE_URL).hostname}:58081`;

const authRoutes = require("./routes/auth.routes");
const dniRoutes = require("./routes/dni.routes");
const rolRoutes = require("./routes/rol.routes");
const busRoutes = require("./routes/buses.routes");
const estadoBusRoutes = require('./routes/estadobus.router');
const marcaRoutes = require('./routes/marca.routes');
const viajesRoutes = require('./routes/viajes.routes')
const rutaRoutes = require('./routes/rutas.routes');
const estadoviajeRoutes = require('./routes/estadoviaje.routes');
const asientosRoutes = require('./routes/asientos.routes');
const viajeAsientoRoutes = require('./routes/viajeAsiento.routes');
const paymentRoutes = require('./routes/payments');
const busTrackingRoutes = require('./routes/busTracking');
const pagoRoutes = require('./routes/pagos');
const ticketRoutes = require('./routes/ticket');
const reservaRoutes = require('./routes/reserva.routes');


const app = express();
const server = http.createServer(app); 
const { iniciarCronJob } = require('./jobs/liberarAsientosJob');
const PORT = process.env.PORT || 3000;

const prisma = new PrismaClient();

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

const activeBusLocations = new Map();

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (token) {
      // Verificar token JWT si es necesario
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
    }
    next();
  } catch (error) {
    next(new Error('Autenticación fallida'));
  }
});


io.on('connection', (socket) => {
  console.log(`🟢 Cliente conectado: ${socket.id}`);
  
  socket.on('driver:update-location', async (data) => {
    const { busId, latitude, longitude, speed, heading, viajeId } = data;
    
    try {
      const locationData = {
        busId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        viajeId,
        timestamp: new Date(),
        socketId: socket.id
      };
      
      activeBusLocations.set(busId, locationData);
      
      // Guardar en base de datos (historial)
      await prisma.ubicacionBus.create({
        data: {
          busId: parseInt(busId),
          viajeId: viajeId ? parseInt(viajeId) : null,
          latitud: latitude,
          longitud: longitude,
          velocidad: speed || 0,
          timestamp: new Date()
        }
      });
      
      // Actualizar última ubicación en la tabla Bus (opcional)
      await prisma.bus.update({
        where: { id: parseInt(busId) },
        data: {
          ultimaLatitud: latitude,
          ultimaLongitud: longitude,
          ultimaActualizacion: new Date()
        }
      });
      
      // Emitir a todos los usuarios suscritos a este bus
      io.to(`bus:${busId}`).emit('bus:location-updated', {
        busId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date()
      });
      
      // También emitir al viaje específico si existe
      if (viajeId) {
        io.to(`viaje:${viajeId}`).emit('viaje:location-updated', {
          busId,
          viajeId,
          latitude,
          longitude,
          speed: speed || 0
        });
      }
      
      console.log(`📍 Bus ${busId} actualizado: ${latitude}, ${longitude}`);
    } catch (error) {
      console.error('Error guardando ubicación:', error);
      socket.emit('error', { message: 'Error al guardar ubicación' });
    }
  });
  
  // Pasajero se suscribe a un bus específico
  socket.on('passenger:subscribe-bus', (busId) => {
    const room = `bus:${busId}`;
    socket.join(room);
    console.log(`👤 Usuario ${socket.id} suscrito al bus ${busId}`);
    
    // Enviar última ubicación conocida
    const lastLocation = activeBusLocations.get(busId.toString());
    if (lastLocation) {
      socket.emit('bus:location-updated', {
        busId: lastLocation.busId,
        latitude: lastLocation.latitude,
        longitude: lastLocation.longitude,
        speed: lastLocation.speed,
        timestamp: lastLocation.timestamp
      });
    }
  });
  
  // Pasajero se suscribe a un viaje específico
  socket.on('passenger:subscribe-viaje', (viajeId) => {
    const room = `viaje:${viajeId}`;
    socket.join(room);
    console.log(`👤 Usuario ${socket.id} suscrito al viaje ${viajeId}`);
  });
  
  // Pasajero se desuscribe
  socket.on('passenger:unsubscribe-bus', (busId) => {
    const room = `bus:${busId}`;
    socket.leave(room);
    console.log(`👤 Usuario ${socket.id} desuscrito del bus ${busId}`);
  });
  
  // Solicitar ubicación actual de un bus
  socket.on('get:bus-location', (busId) => {
    const location = activeBusLocations.get(busId.toString());
    socket.emit('bus:location-response', location || null);
  });
  
  // Obtener todos los buses activos
  socket.on('get:active-buses', () => {
    const activeBuses = Array.from(activeBusLocations.values()).map(loc => ({
      busId: loc.busId,
      latitude: loc.latitude,
      longitude: loc.longitude,
      speed: loc.speed,
      lastUpdate: loc.timestamp
    }));
    socket.emit('active-buses-list', activeBuses);
  });
  
  socket.on('disconnect', () => {
    console.log(`🔴 Cliente desconectado: ${socket.id}`);
    // Opcional: limpiar ubicaciones de buses desconectados después de un tiempo
  });
});

// Middleware para hacer io accesible en las rutas
app.use((req, res, next) => {
  req.io = io;
  req.activeBusLocations = activeBusLocations;
  next();
});

// Middleware estándar
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
iniciarCronJob();

// Rutas existentes
app.use("/api/auth", authRoutes);
app.use("/api/dni", dniRoutes);
app.use("/api/rol", rolRoutes);
app.use("/api/bus", busRoutes);
app.use('/api/estados-bus', estadoBusRoutes);
app.use('/api/marcas', marcaRoutes);
app.use('/api/rutas', rutaRoutes);
app.use('/api/viajes', viajesRoutes);
app.use('/api/estados-viaje', estadoviajeRoutes);
app.use('/api/asientos', asientosRoutes);
app.use('/api/viaje-asiento', viajeAsientoRoutes);
app.use('/api/bus-tracking', busTrackingRoutes);
app.use('/api/mercadopago', paymentRoutes);
app.use('/api/pago', pagoRoutes);
app.use('/api/ticket', ticketRoutes);
app.use('/api/reserva', reservaRoutes);


// También necesitas exponer el webhook de MercadoPago
app.post('/webhook', ticketRoutes); // o directamente: app.post('/webhook', ticketRoutes);


app.use(express.static(path.join(__dirname, "public")));

// Ruta de prueba
app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando 🚀" });
});


const serveResetPasswordHtml = (req, res) => {
  const fs = require('fs');
  const htmlPath = path.join(__dirname, "public", "reset-password.html");
  let html = fs.readFileSync(htmlPath, 'utf8');
  
  // Inyectar variables del .env
  html = html.replace(/{{API_URL}}/g, API_URL);
  html = html.replace(/{{EXPO_URL}}/g, EXPO_URL);
  
  res.send(html);
};

app.get("/reset-password", serveResetPasswordHtml);
app.get("/reset-password/:token", serveResetPasswordHtml);

app.get("/api/tracking/stats", (req, res) => {
  const activeCount = activeBusLocations.size;
  const buses = Array.from(activeBusLocations.values()).map(loc => ({
    busId: loc.busId,
    lastUpdate: loc.timestamp,
    speed: loc.speed
  }));
  
  res.json({
    activeBuses: activeCount,
    buses: buses,
    timestamp: new Date()
  });
});

// Probar conexión DB
async function testDB() {
  try {
    await prisma.$connect();
    console.log("✅ Conectado a la base de datos correctamente");
  } catch (error) {
    console.error("❌ Error conectando a la base:", error);
  }
}

testDB();

// Iniciar servidor con Socket.IO
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📡 Socket.IO disponible en ws://localhost:${PORT}`);
  console.log(`📧 Ruta reset password: http://localhost:${PORT}/reset-password?token=...`);
});