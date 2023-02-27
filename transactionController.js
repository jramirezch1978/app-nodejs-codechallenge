const TransactionService = require('./transactionService');

class TransactionController {
  static async createTransaction(req, res) {
    try {
      const { cuentaExternoIdDebit, cuentaExternoIdCredito, transferTypeId, valor } = req.body;

      // Rechazar la transacción si el valor es mayor a 1000
      if (valor > 1000) {
        await TransactionService.createTransaction(cuentaExternoIdDebit, 
                                                   cuentaExternoIdCredito, 
                                                   transferTypeId, 
                                                   valor, 
                                                   'rechazado');
                                                   
        res.status(400).json({ message: 'El valor de la transacción supera el límite permitido.' });
        return;
      }

      const transaction = await TransactionService.createTransaction(cuentaExternoIdDebit, 
                                                                     cuentaExternoIdCredito, 
                                                                     transferTypeId, 
                                                                     valor, 
                                                                     'pendiente');
      res.status(201).json(transaction);
    } catch (err) {
      console.log(err);
      res.status(500).send('Ha ocurrido un error al crear la transacción.');
    }
  }

  static async getTransaction(req, res) {
    try {
      const { transactionExternalId } = req.params;
      const transaction = await TransactionService.getTransaction(transactionExternalId);
      res.json(transaction);
    } catch (err) {
      console.log(err);
      res.status(404).json({ message: 'Transacción no encontrada.' });
    }
  }

  static async updateTransaction(req, res) {
    try {
      const { transactionExternalId } = req.params;
      const { estadoTransaccion } = req.body;

      if (!['pendiente', 'aprobado', 'rechazado'].includes(estadoTransaccion)) {
        res.status(400).json({ message: 'El estado de la transacción no es válido.' });
        return;
      }

      const transaction = await TransactionService.updateTransaction(transactionExternalId, estadoTransaccion);
      res.json(transaction);
    } catch (err) {
      console.log(err);
      res.status(500).send('Ha ocurrido un error al actualizar la transacción.');
    }
  }
}

module.exports = TransactionController;
