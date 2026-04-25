// config/mercadopago.js
const mercadopago = require('mercadopago');

// Credenciales de prueba primero, luego cambia a producción
mercadopago.configure({
  //access_token: 'TU_ACCESS_TOKEN_DE_PRUEBA'
  access_token: process.env.MERCADO_PAGO_ACCESS_TOKEN
});

module.exports = mercadopago;