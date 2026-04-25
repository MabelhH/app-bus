const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  const rutas = await prisma.ruta.findMany({ 
    where: { estado: true }, 
    orderBy: { createdAt: 'asc' } 
  });
  
  const vistas = new Map();
  
  for (const ruta of rutas) {
    const key = ruta.origen.toLowerCase() + '-' + ruta.destino.toLowerCase();
    
    if (vistas.has(key)) {
      await prisma.ruta.update({ 
        where: { id: ruta.id }, 
        data: { estado: false } 
      });
      console.log('Desactivado:', ruta.origen, '->', ruta.destino);
    } else {
      vistas.set(key, ruta.id);
      console.log('Mantenido:', ruta.origen, '->', ruta.destino);
    }
  }
  
  await prisma.$disconnect();
}

fix().catch(console.error);