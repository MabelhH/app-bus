// backend/services/ubicacionBus.service.js
const axios = require('axios');

const obtenerCoordenadas = async (direccion) => {
  try {
    console.log(`🔍 Buscando coordenadas para: ${direccion}`);
    
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: `${direccion}, Perú`,
        format: 'json',
        limit: 1,
      },
      headers: {
        'User-Agent': 'BusApp/1.0',
      },
      timeout: 5000,
    });

    if (response.data && response.data.length > 0) {
      const lugar = response.data[0];
      return {
        lat: parseFloat(lugar.lat),
        lng: parseFloat(lugar.lon),
        direccion: lugar.display_name,
        nombre: lugar.name,
      };
    }
    return null;
  } catch (error) {
    console.error('Error:', error.message);
    return null;
  }
};

const calcularDistancia = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const obtenerDireccion = async (lat, lng) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { lat, lon: lng, format: 'json' },
      headers: { 'User-Agent': 'BusApp/1.0' },
    });
    return response.data?.display_name || null;
  } catch (error) {
    return null;
  }
};

module.exports = { obtenerCoordenadas, calcularDistancia, obtenerDireccion };