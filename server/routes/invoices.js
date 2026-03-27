const express = require('express');
const router = express.Router();
const asyncHandler = require('../helpers/asyncHandler');
const invoiceController = require('../controllers/invoiceController');

router.get('/invoices', asyncHandler(invoiceController.getInvoices));

module.exports = router;
