const express = require('express');
const router = express.Router();
const { RepairRequest, Tenant, Property } = require('../models');
const multer = require('multer');
const path = require('path');

// Configure Multer for Repairs
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/repairs');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Submit a repair request (Tenant)
router.post('/repairs', upload.single('image'), async (req, res) => {
  try {
    const { propertyId, unit, description } = req.body;
    const repairRequest = new RepairRequest({
      tenant: req.user.id,
      property: propertyId,
      unit,
      description,
      imagePath: req.file ? req.file.path : null
    });
    await repairRequest.save();
    res.status(201).json(repairRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get repair requests
router.get('/repairs', async (req, res) => {
  try {
    let requests;
    if (req.user.role === 'landlord') {
      // Find properties owned by this landlord
      const properties = await Property.find({ landlord: req.user.id });
      const propertyIds = properties.map(p => p._id);
      requests = await RepairRequest.find({ property: { $in: propertyIds } })
        .populate('tenant', 'name email')
        .populate('property', 'name address');
    } else {
      // Tenant sees their own requests
      requests = await RepairRequest.find({ tenant: req.user.id })
        .populate('property', 'name address');
    }
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update repair request (Landlord)
router.put('/repairs/:id', async (req, res) => {
  try {
    if (req.user.role !== 'landlord') {
      return res.status(403).json({ message: 'Only landlords can update repair requests.' });
    }
    const { status, landlordResponse, technicianDetails } = req.body;
    const repairRequest = await RepairRequest.findByIdAndUpdate(
      req.params.id,
      { status, landlordResponse, technicianDetails },
      { new: true }
    );
    res.json(repairRequest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
