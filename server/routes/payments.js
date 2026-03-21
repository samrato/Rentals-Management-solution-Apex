const express = require('express');
const router = express.Router();
const { MpesaTransaction, Payment, Tenant, User } = require('../models');
const { initiateSTKPush } = require('../services/mpesaService');
const { sendPaymentConfirmation, notifyLandlord } = require('../services/emailService');

// Get payments (Landlord sees all for their properties, Tenant sees their own)
router.get('/payments', async (req, res) => {
  try {
    let payments;
    if (req.user.role === 'landlord') {
      const properties = await Property.find({ landlord: req.user.id });
      const propertyIds = properties.map(p => p._id);
      const tenants = await Tenant.find({ property: { $in: propertyIds } });
      const tenantIds = tenants.map(t => t._id);
      payments = await Payment.find({ tenant: { $in: tenantIds } })
        .populate({ path: 'tenant', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 });
    } else {
      const tenant = await Tenant.findOne({ user: req.user.id });
      payments = await Payment.find({ tenant: tenant._id })
        .populate({ path: 'tenant', populate: { path: 'user', select: 'name' } })
        .sort({ createdAt: -1 });
    }
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initiate STK Push
router.post('/payments/stkpush', async (req, res) => {
  const { amount, phoneNumber, tenantId } = req.body;
  
  try {
    let tenant = await Tenant.findById(tenantId).populate('user');
    if (!tenant) {
      // Try searching by user ID if tenantId was actually a user ID
      tenant = await Tenant.findOne({ user: tenantId }).populate('user');
    }
    
    if (!tenant) return res.status(404).json({ error: "Tenant profile not found" });

    const response = await initiateSTKPush(phoneNumber, amount, `Tenant-${tenantId}`);
    
    // Create pending transaction
    const transaction = new MpesaTransaction({
      merchantRequestId: response.MerchantRequestID,
      checkoutRequestId: response.CheckoutRequestID,
      phoneNumber,
      amount,
      status: 'pending'
    });
    await transaction.save();

    res.json({ message: "STK Push initiated", checkoutRequestId: response.CheckoutRequestID });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mpesa Callback
router.post('/payments/callback', async (req, res) => {
  const callbackData = req.body.Body.stkCallback;
  const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callbackData;

  try {
    const transaction = await MpesaTransaction.findOne({ checkoutRequestId: CheckoutRequestID });
    if (!transaction) return res.status(404).json({ error: "Transaction not found" });

    transaction.resultCode = ResultCode;
    transaction.resultDesc = ResultDesc;

    if (ResultCode === 0) {
      const metadata = callbackData.CallbackMetadata.Item;
      transaction.mpesaReceiptNumber = metadata.find(i => i.Name === 'MpesaReceiptNumber').Value;
      transaction.transactionDate = new Date(); // Or parse from metadata
      transaction.status = 'completed';
      await transaction.save();

      // Update related Payment
      const payment = await Payment.findOne({ mpesaTransaction: transaction._id }) || 
                      await Payment.findOne({ tenant: transaction.tenant, status: 'pending' }); // Fallback logic
      
      if (payment) {
        payment.status = 'paid';
        payment.paymentDate = new Date();
        payment.mpesaTransaction = transaction._id;
        await payment.save();

        // Notifications
        const tenant = await Tenant.findById(payment.tenant).populate('user property');
        const landlord = await User.findById(tenant.property.landlord);

        await sendPaymentConfirmation(tenant.user.email, tenant.user.name, transaction.amount, transaction.mpesaReceiptNumber);
        await notifyLandlord(landlord.email, tenant.user.name, transaction.amount, tenant.unit);
      }
    } else {
      transaction.status = 'failed';
      await transaction.save();
    }

    res.json({ message: "Callback processed" });
  } catch (err) {
    console.error("Callback Processing Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
