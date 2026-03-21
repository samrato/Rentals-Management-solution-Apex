const express = require('express');
const router = express.Router();
const { generateReminder } = require('../services/aiService');
const { Tenant, Property } = require('../models');

// Trigger AI Reminder
router.post('/reminders/generate', async (req, res) => {
  try {
    const { tenantId } = req.body;
    const tenant = await Tenant.findById(tenantId).populate('user');
    const property = await Property.findById(tenant.property);

    if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

    const reminderText = await generateReminder(
      tenant.user.name,
      property.address,
      tenant.rentAmount,
      tenant.dueDate
    );

    res.json({ reminderText });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
