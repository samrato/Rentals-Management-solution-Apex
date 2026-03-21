const express = require('express');
const router = express.Router();
const { Suggestion, Tenant, Property } = require('../models');

// Send anonymous suggestion
router.post('/suggestions', async (req, res) => {
  try {
    const userId = req.user.id;
    // Find the tenant's property
    const tenant = await Tenant.findOne({ user: userId, status: 'active' });
    if (!tenant) {
      return res.status(403).json({ message: 'Only active tenants can send suggestions' });
    }

    const suggestion = new Suggestion({
      property: tenant.property,
      content: req.body.content
    });

    await suggestion.save();
    res.status(201).json({ message: 'Suggestion sent anonymously!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get suggestions for landlord's properties
router.get('/suggestions', async (req, res) => {
  try {
    const landlordId = req.user.id;
    // Find properties owned by this landlord
    const properties = await Property.find({ landlord: landlordId });
    const propertyIds = properties.map(p => p._id);

    // Find suggestions for these properties
    const suggestions = await Suggestion.find({
      property: { $in: propertyIds }
    }).populate('property', 'name address').sort({ createdAt: -1 });

    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
