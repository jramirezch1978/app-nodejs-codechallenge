const { v4: uuidv4 } = require('uuid');
const { Kafka } = require('kafkajs');
const mongoose = require('mongoose');

// Conectar a la base de datos de MongoDB
mongoose.connect('mongodb://mongo:27017/transactions', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.log(err));

// Definir el modelo de transacción
const transactionSchema = new mongoose.Schema({
  transactionExternalId: { type: String, required: true },
  cuentaExternoIdDebit: { type: String, required: true },
  cuentaExternoIdCredito: { type: String, required: true },
  transferTypeId: { type: Number, required: true },
  valor: { type: Number, required: true },
  tipoTransaccion: { type: String, required: true },
  estadoTransaccion: { type: String, required: true },
  creadoEn: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

class TransactionService {
  static async createTransaction(cuentaExternoIdDebit, cuentaExternoIdCredito, transferTypeId, valor, estadoTransaccion) {
    let estadoTransaccion = 'pendiente';

    if (valor > 1000) {
      estadoTransaccion = 'rechazado';
    }

    const transaction = {
      transactionExternalId: uuidv4(),
      cuentaExternoIdDebit,
      cuentaExternoIdCredito,
      transferTypeId,
      valor,
      tipoTransaccion: 'normal',
      estadoTransaccion,
      creadoEn: new Date()
    };


    // Publicar un mensaje en el topic de Kafka 'transactions' para que sea validado por el servicio de antifraude
    const kafka = new Kafka({
      clientId: 'transactions-service',
      brokers: ['kafka:9092']
    });

    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: 'transactions',
      messages: [{ value: JSON.stringify(transaction) }]
    });
    await producer.disconnect();

    // Guardar la transacción en la base de datos
    const newTransaction = new Transaction(transaction);
    await newTransaction.save();

    return transaction;
  }

  static async getTransaction(transactionExternalId) {
    // Buscar la transacción en la base de datos
    const transaction = await Transaction.findOne({ transactionExternalId });

    if (transaction) {
      return transaction;
    } else {
      throw new Error('Transacción no encontrada');
    }
  }

  static async updateTransaction(transaction) {
    // Actualizar el estado de la transacción en la base de datos
    await Transaction.updateOne({ transactionExternalId: transaction.transactionExternalId }, transaction);

    // Publicar un mensaje en el topic de Kafka 'transactions-updates' para indicar que la transacción ha sido actualizada
    const kafka = new Kafka({
      clientId: 'transactions-service',
      brokers: ['kafka:9092']
    });

    const producer = kafka.producer();
    await producer.connect();
    await producer.send({
      topic: 'transactions-updates',
      messages: [{ value: JSON.stringify(transaction) }]
    });
    await producer.disconnect();
  }
}

module.exports = TransactionService;
