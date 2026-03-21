const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Lease, User, Property } = require('../models');

// Configure Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/leases');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /pdf|doc|docx|jpg|jpeg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Error: File upload only supports the following filetypes - " + filetypes));
  }
});

// Upload Lease (Landlord Only)
router.post('/leases/upload', upload.single('lease'), async (req, res) => {
  try {
    const { tenantId, propertyId, unit } = req.body;
    const lease = new Lease({
      tenant: tenantId,
      property: propertyId,
      unit: unit,
      filePath: req.file.path,
      fileName: req.file.originalname
    });
    await lease.save();
    res.status(201).json(lease);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get Lease for Tenant
router.get('/leases/tenant', async (req, res) => {
  try {
    const lease = await Lease.findOne({ tenant: req.user.id })
      .populate('property', 'name address');
    res.json(lease);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get All Leases for Landlord
router.get('/leases/landlord', async (req, res) => {
  try {
    const properties = await Property.find({ landlord: req.user.id });
    const propertyIds = properties.map(p => p._id);
    const leases = await Lease.find({ property: { $in: propertyIds } })
      .populate('tenant', 'name email')
      .populate('property', 'name');
    res.json(leases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download/View Lease
router.get('/leases/view/:id', async (req, res) => {
  try {
    const lease = await Lease.findById(req.params.id);
    if (!lease) return res.status(404).json({ error: "Lease not found" });
    
    // Check authorization: only the tenant or the landlord of the property can view
    const property = await Property.findById(lease.property);
    if (req.user.role === 'tenant' && lease.tenant.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }
    if (req.user.role === 'landlord' && property.landlord.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    res.sendFile(path.join(__dirname, '../', lease.filePath));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
