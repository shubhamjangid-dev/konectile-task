const express = require('express');
const router = express.Router();
const partyInvoiceController = require('../controller/PartyInvoice');

// Reset counter
router.post('/reset-counter', partyInvoiceController.resetCounter);

// Get next invoice number
router.get('/next-number', partyInvoiceController.getNextInvoiceNumber);

// Create a new invoice
router.post('/create', partyInvoiceController.createInvoice);

// Get all invoices
router.get('/', partyInvoiceController.getAllInvoices);

// Get single invoice
router.get('/:id', partyInvoiceController.getInvoice);

// Delete invoice
router.delete('/:id', partyInvoiceController.deleteInvoice);

// Update invoice
router.put('/:id', partyInvoiceController.updateInvoice);

module.exports = router;