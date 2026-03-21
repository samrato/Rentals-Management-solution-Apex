const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Property, Tenant } = require('../models');

// Get available properties and units
router.get('/properties/available', async (req, res) => {
  try {
    const properties = await Property.find();
    const availableProperties = await Promise.all(properties.map(async (property) => {
      // Find all active tenants for this property
      const activeTenants = await Tenant.find({ property: property._id, status: 'active' });
      const occupiedUnits = activeTenants.map(t => t.unit);
      
      // Filter out occupied units
      const unoccupiedUnits = property.units.filter(u => !occupiedUnits.includes(u));
      
      return {
        _id: property._id,
        name: property.name,
        address: property.address,
        units: unoccupiedUnits
      };
    }));
    
    // Only return properties with at least one unoccupied unit
    res.json(availableProperties.filter(p => p.units.length > 0));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, interestedProperty, interestedUnit } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const status = role === 'landlord' ? 'active' : 'pending';
    const user = new User({ 
      name, 
      email, 
      password, 
      role, 
      status,
      interestedProperty: role === 'tenant' ? interestedProperty : undefined,
      interestedUnit: role === 'tenant' ? interestedUnit : undefined
    });

    await user.save();
    res.status(201).json({ 
      message: role === 'landlord' ? 'Landlord registered successfully' : 'Registration request submitted. Waiting for landlord approval.',
      status: user.status
    });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: 'Internal server error during registration' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password }).populate('interestedProperty', 'name');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        role: user.role, 
        status: user.status,
        interestedProperty: user.interestedProperty,
        interestedUnit: user.interestedUnit
      } 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
