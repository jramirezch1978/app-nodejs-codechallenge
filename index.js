const express = require('express');
const bodyParser = require('body-parser');
const TransactionController = require('./transactionController');

const app = express();
const port = 3000;

// Middleware para analizar el cuerpo de las solicitudes HTTP
app.use(bodyParser.json());

// Definir las rutas de la API
app.post('/transactions', TransactionController.createTransaction);
app.get('/transactions/:transactionExternalId', TransactionController.getTransaction);

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servicio de antifraude iniciado en http://localhost:${port}`);
});