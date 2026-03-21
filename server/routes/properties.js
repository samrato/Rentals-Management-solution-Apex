const express = require('express');
const router = express.Router();
const { Property, Tenant, User } = require('../models');

// Get all properties for a landlord
router.get('/properties', async (req, res) => {
  try {
    const properties = await Property.find({ landlord: req.user.id });
    res.json(properties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a property
router.post('/properties', async (req, res) => {
  try {
    const property = new Property({ ...req.body, landlord: req.user.id });
    await property.save();
    res.status(201).json(property);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update a property
router.put('/properties/:id', async (req, res) => {
  try {
    const propertyId = req.params.id;
    const landlordId = req.user.id;
    console.log(`[Property Update] ID: ${propertyId}, Landlord: ${landlordId}`);
    console.log("[Property Update] Body:", JSON.stringify(req.body, null, 2));

    const property = await Property.findOneAndUpdate(
      { _id: propertyId, landlord: landlordId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!property) {
      console.warn(`[Property Update] FAILED: Property ${propertyId} not found or not owned by ${landlordId}`);
      // Check if property exists at all
      const exists = await Property.findById(propertyId);
      if (!exists) {
        return res.status(404).json({ message: 'Property not found in database' });
      } else {
        return res.status(403).json({ message: 'You do not have permission to edit this property' });
      }
    }
    
    console.log("[Property Update] SUCCESS");
    res.json(property);
  } catch (err) {
    console.error("[Property Update] EXCEPTION:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get all tenants for a property
router.get('/properties/:id/tenants', async (req, res) => {
  try {
    const tenants = await Tenant.find({ property: req.params.id }).populate('user', 'name email');
    res.json(tenants);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a tenant to a unit
router.post('/tenants', async (req, res) => {
  try {
    const tenant = new Tenant(req.body);
    await tenant.save();
    res.status(201).json(tenant);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get pending registrations for landlord's properties
router.get('/pending-registrations', async (req, res) => {
  try {
    const landlordId = req.user.id;
    // Find all properties owned by this landlord
    const properties = await Property.find({ landlord: landlordId });
    const propertyIds = properties.map(p => p._id);

    // Find users who are pending and interested in one of these properties
    const pendingUsers = await User.find({
      status: 'pending',
      interestedProperty: { $in: propertyIds }
    }).populate('interestedProperty', 'name address');

    res.json(pendingUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve registration
router.post('/approve-registration/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const landlordId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const property = await Property.findOne({ _id: user.interestedProperty, landlord: landlordId });
    if (!property) return res.status(403).json({ message: 'Unauthorized to approve for this property' });

    // Check if unit is still available
    const existingTenant = await Tenant.findOne({ 
      property: property._id, 
      unit: user.interestedUnit, 
      status: 'active' 
    });
    if (existingTenant) {
      return res.status(400).json({ message: 'Unit is already occupied' });
    }

    // Create Tenant record
    const tenant = new Tenant({
      user: user._id,
      property: property._id,
      unit: user.interestedUnit,
      rentAmount: req.body.rentAmount || 0, // Landlord might specify rent during approval
      status: 'active'
    });
    await tenant.save();

    // Update user status
    user.status = 'active';
    await user.save();

    res.json({ message: 'User approved and added as tenant', tenant });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reject registration
router.post('/reject-registration/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const landlordId = req.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const property = await Property.findOne({ _id: user.interestedProperty, landlord: landlordId });
    if (!property) return res.status(403).json({ message: 'Unauthorized to reject for this property' });

    user.status = 'rejected';
    await user.save();

    res.json({ message: 'User registration rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
