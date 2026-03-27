const express = require('express');
const router = express.Router();
const asyncHandler = require('../helpers/asyncHandler');
const propertyController = require('../controllers/propertyController');
const { propertyUpload } = require('../helpers/upload');

router.get('/tenants', asyncHandler(propertyController.getTenants));
router.put('/tenants/activate/:tenantId', asyncHandler(propertyController.activateTenancy));
router.get('/properties', asyncHandler(propertyController.getProperties));
router.post('/properties', propertyUpload.array('images', 10), asyncHandler(propertyController.createProperty));
router.put('/properties/:id', propertyUpload.array('images', 10), asyncHandler(propertyController.updateProperty));
router.delete('/properties/:id', asyncHandler(propertyController.deleteProperty));
router.get('/properties/:id/tenants', asyncHandler(propertyController.getPropertyTenants));
router.post('/tenants', asyncHandler(propertyController.createTenant));
router.get('/pending-registrations', asyncHandler(propertyController.getPendingRegistrations));
router.post('/approve-registration/:userId', asyncHandler(propertyController.approveRegistration));
router.post('/reject-registration/:userId', asyncHandler(propertyController.rejectRegistration));
router.put('/tenants/:id', asyncHandler(propertyController.updateTenant));

module.exports = router;
