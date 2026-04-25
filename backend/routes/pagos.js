const express = require('express');
const router = express.Router();
const path = require('path');

router.get('/pago-success', (req, res) =>   {
    //res.send('¡Pago exitoso! Gracias por tu compra.');
    //res.sendFile(path.join(__dirname, '../public/success.html'));
    res.send('OK_SUCCESS');
});

router.get('/pago-failure', (req, res) => {
    //res.send('El pago ha fallado. Por favor, inténtalo de nuevo.');
    //res.sendFile(path.join(__dirname, '../public/failure.html'));
    res.send('OK_FAILURE');
});

router.get('/pago-pendiente', (req, res) => {
    //res.send('El pago está pendiente. Te notificaremos cuando se procese.');
    //res.sendFile(path.join(__dirname, '../public/pending.html'));  
    res.send('OK_PENDING'); 
}); 

module.exports = router;