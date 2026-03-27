const express = require('express');
const asyncHandler = require('../helpers/asyncHandler');
const unitController = require('../controllers/unitController');
const { unitUpload } = require('../helpers/upload');

const router = express.Router();

router.get('/properties/:propertyId/units', asyncHandler(unitController.getUnitsByProperty));
router.post('/units', unitUpload.array('images', 10), asyncHandler(unitController.createUnit));
router.put('/units/:id', unitUpload.array('images', 10), asyncHandler(unitController.updateUnit));

module.exports = router;
