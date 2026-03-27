const { Invoice, Lease, Notification, Property, RepairRequest, Tenant, Unit, User } = require('../models');
const { logRequestAudit } = require('../helpers/audit');
const { sendError } = require('../helpers/apiResponse');
const { ensureOrganizationForUser } = require('../helpers/organization');
const { toStoredUploadPath } = require('../helpers/upload');
const { ROLES } = require('../helpers/rbac');
const { 
  sendPropertyRegistration, 
  sendTenantApproval 
} = require('../services/emailService');
const { createNotification } = require('../helpers/notifications');

const { createRentInvoice, createDepositInvoice } = require('./invoiceController');

const manageRoles = [ROLES.LANDLORD, ROLES.PROPERTY_MANAGER, ROLES.SUPER_ADMIN];

const sanitizeUnits = (units = []) => {
  const input = Array.isArray(units) ? units : [units];
  return [...new Set(input.map((unit) => String(unit).trim()).filter(Boolean))];
};
const buildManagedPropertyQuery = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) {
    return {};
  }

  return {
    organization: user.organizationId,
    $or: [
      { landlord: user.id },
      { manager: user.id }
    ]
  };
};

const syncPropertyUnits = async (property, unitsInput, defaultPrice = 0) => {
  const normalizedUnits = sanitizeUnits(unitsInput ?? property.units);
  property.units = normalizedUnits;
  await property.save();

  const [existingUnits, activeTenants] = await Promise.all([
    Unit.find({ property: property._id }),
    Tenant.find({ property: property._id, status: 'active' })
  ]);

  const occupiedByUnit = new Map(activeTenants.map((tenant) => [tenant.unit, tenant._id]));
  const unitMap = new Map(existingUnits.map((unit) => [unit.unitNumber, unit]));

  for (const unitNumber of normalizedUnits) {
    const tenantAssignment = occupiedByUnit.get(unitNumber) || null;
    const occupancyStatus = tenantAssignment ? 'occupied' : 'vacant';
    const existingUnit = unitMap.get(unitNumber);

    if (!existingUnit) {
      await Unit.create({
        organization: property.organization,
        property: property._id,
        unitNumber,
        rentAmount: Number(defaultPrice || 0),
        occupancyStatus,
        tenantAssignment
      });
      continue;
    }

    existingUnit.organization = property.organization;
    existingUnit.isActive = true;
    existingUnit.tenantAssignment = tenantAssignment;
    existingUnit.occupancyStatus = occupancyStatus;
    await existingUnit.save();
  }

  await Unit.updateMany({
    property: property._id,
    unitNumber: { $nin: normalizedUnits }
  }, {
    $set: {
      isActive: false,
      occupancyStatus: 'vacant',
      tenantAssignment: null
    }
  });
};

const getProperties = async (req, res) => {
  const properties = await Property.find(buildManagedPropertyQuery(req.user));
  res.json(properties);
};

const createProperty = async (req, res) => {
  if (!manageRoles.includes(req.user.role)) {
    sendError(res, 403, 'Only landlords or managers can create properties');
    return;
  }

  const currentUser = await User.findById(req.user.id);
  const organizationId = await ensureOrganizationForUser(currentUser);

  const images = req.files ? req.files.map((file) => toStoredUploadPath(file.path)) : [];

  const property = new Property({
    ...req.body,
    organization: organizationId,
    landlord: req.user.role === ROLES.SUPER_ADMIN && req.body.landlord ? req.body.landlord : req.user.id,
    manager: req.body.manager || (req.user.role === ROLES.PROPERTY_MANAGER ? req.user.id : undefined),
    units: sanitizeUnits(req.body.units),
    images,
    latePenaltyAmount: Number(req.body.latePenaltyAmount || 0),
    latePenaltyType: req.body.latePenaltyType || 'flat'
  });

  await property.save();
  await syncPropertyUnits(property, property.units, req.body.defaultUnitPrice);

  await logRequestAudit({
    req,
    organization: property.organization,
    action: 'Property created',
    entityType: 'property',
    entityId: property._id,
    metadata: {
      propertyName: property.name,
      summary: `${property.name} • ${property.units.length} units`
    }
  });

  res.status(201).json(property);

  // Background email notification
  if (currentUser && currentUser.email) {
    sendPropertyRegistration(currentUser.email, property.name, property.units.length);
  }
};

const updateProperty = async (req, res) => {
  const propertyId = req.params.id;

  const images = req.files && req.files.length > 0
    ? req.files.map((file) => toStoredUploadPath(file.path))
    : req.body.images;

  const property = await Property.findOneAndUpdate(
    { _id: propertyId, ...buildManagedPropertyQuery(req.user) },
    {
      ...req.body,
      units: req.body.units ? sanitizeUnits(req.body.units) : undefined,
      images,
      latePenaltyAmount: req.body.latePenaltyAmount !== undefined ? Number(req.body.latePenaltyAmount) : undefined,
      latePenaltyType: req.body.latePenaltyType
    },
    { new: true, runValidators: true }
  );

  if (property && req.body.units) {
    await syncPropertyUnits(property, property.units, req.body.defaultUnitPrice);
  }

  if (!property) {
    const exists = await Property.findById(propertyId);
    if (!exists) {
      sendError(res, 404, 'Property not found in database');
      return;
    }

    sendError(res, 403, 'You do not have permission to edit this property');
    return;
  }

  if (req.body.units) {
    await syncPropertyUnits(property, req.body.units);
  }

  await logRequestAudit({
    req,
    organization: property.organization,
    action: 'Property updated',
    entityType: 'property',
    entityId: property._id,
    metadata: {
      propertyName: property.name,
      summary: `${property.name} updated`
    }
  });

  res.json(property);
};

const getPropertyTenants = async (req, res) => {
  const tenants = await Tenant.find({ property: req.params.id }).populate('user', 'name email phoneNumber role');
  res.json(tenants);
};

const createTenant = async (req, res) => {
  if (!manageRoles.includes(req.user.role)) {
    sendError(res, 403, 'Only landlords or managers can add tenants');
    return;
  }

  const property = await Property.findOne({
    _id: req.body.property,
    ...buildManagedPropertyQuery(req.user)
  });

  if (!property) {
    sendError(res, 404, 'Property not found');
    return;
  }

  const tenant = new Tenant({
    ...req.body,
    organization: property.organization
  });

  await tenant.save();

  if (tenant.user) {
    await User.findByIdAndUpdate(tenant.user, {
      status: 'active',
      organization: property.organization
    });
  }

  await Unit.findOneAndUpdate({
    property: property._id,
    unitNumber: tenant.unit
  }, {
    $set: {
      organization: property.organization,
      occupancyStatus: 'occupied',
      tenantAssignment: tenant._id,
      isActive: true
    }
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  if (!property.units.includes(tenant.unit)) {
    property.units.push(tenant.unit);
    await property.save();
  }

  await logRequestAudit({
    req,
    organization: property.organization,
    action: 'Tenant created',
    entityType: 'tenant',
    entityId: tenant._id,
    metadata: {
      propertyName: property.name,
      summary: `Unit ${tenant.unit} assigned`
    }
  });

  res.status(201).json(tenant);
};

const getPendingRegistrations = async (req, res) => {
  const properties = await Property.find(buildManagedPropertyQuery(req.user));
  const propertyIds = properties.map((property) => property._id);

  const pendingUsers = await User.find({
    status: 'pending',
    interestedProperty: { $in: propertyIds }
  }).populate('interestedProperty', 'name address');

  // Fetch unit details to get rent prices
  const registrationsWithPrices = await Promise.all(pendingUsers.map(async (user) => {
    const unit = await Unit.findOne({
      property: user.interestedProperty._id,
      unitNumber: user.interestedUnit
    });
    
    const userObj = user.toObject();
    userObj.suggestedRent = unit ? unit.rentAmount : (user.interestedProperty.defaultUnitPrice || 0);
    return userObj;
  }));

  res.json(registrationsWithPrices);
};

const approveRegistration = async (req, res) => {
  const { userId } = req.params;
  const rentAmount = Number(req.body.rentAmount || 0);

  const user = await User.findById(userId);
  if (!user) {
    sendError(res, 404, 'User not found');
    return;
  }

  const property = await Property.findOne({
    _id: user.interestedProperty,
    ...buildManagedPropertyQuery(req.user)
  });

  if (!property) {
    sendError(res, 403, 'Unauthorized to approve for this property');
    return;
  }

  const existingTenant = await Tenant.findOne({
    property: property._id,
    unit: user.interestedUnit,
    status: 'active'
  });

  if (existingTenant) {
    sendError(res, 400, 'Unit is already occupied');
    return;
  }

  const tenant = new Tenant({
    organization: property.organization,
    user: user._id,
    property: property._id,
    unit: user.interestedUnit,
    rentAmount,
    status: 'pending_activation'
  });

  await tenant.save();

  user.status = 'active';
  user.organization = property.organization;
  await user.save();

  await Unit.findOneAndUpdate({
    property: property._id,
    unitNumber: user.interestedUnit
  }, {
    $set: {
      organization: property.organization,
      tenantAssignment: tenant._id,
      occupancyStatus: 'occupied',
      rentAmount,
      isActive: true
    }
  }, { upsert: true, new: true, setDefaultsOnInsert: true });

  if (!property.units.includes(user.interestedUnit)) {
    property.units.push(user.interestedUnit);
    await property.save();
  }

  // Generate initial invoices: Security Deposit (2x) and First Month Rent
  try {
    const depositAmt = Number(rentAmount) * 2;
    await createDepositInvoice(tenant._id, property._id, depositAmt, property.organization);
    await createRentInvoice(tenant._id, property._id, rentAmount, new Date(), property.organization);
  } catch (invoiceError) {
    console.error("Failed to generate initial invoices on approval:", invoiceError.message);
  }

  await createNotification({
    organization: property.organization,
    user: user._id,
    title: 'Application approved',
    message: `Your application for ${property.name} unit ${user.interestedUnit} has been approved.`,
    type: 'system_notice'
  });

  // Auto-reject other pending applications for this exact unit
  const otherApplicants = await User.find({
    _id: { $ne: user._id },
    interestedProperty: property._id,
    interestedUnit: user.interestedUnit,
    status: 'pending'
  });

  for (const applicant of otherApplicants) {
    applicant.status = 'rejected';
    await applicant.save();

    await createNotification({
      organization: property.organization,
      user: applicant._id,
      title: 'Unit No Longer Available',
      message: `The unit (${user.interestedUnit}) you applied for at ${property.name} has been filled. Your application has been updated to rejected.`,
      type: 'system_notice'
    });
  }

  await logRequestAudit({
    req,
    organization: property.organization,
    action: 'Registration approved',
    entityType: 'tenant',
    entityId: tenant._id,
    metadata: {
      propertyName: property.name,
      summary: `${user.name} • Unit ${user.interestedUnit}`,
      rentAmount
    }
  });

  res.json({ message: 'User approved and added as tenant', tenant });

  // Background email notification
  if (user && user.email) {
    sendTenantApproval(user.email, user.name, property.name, user.interestedUnit);
  }
};

const rejectRegistration = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId);
  if (!user) {
    sendError(res, 404, 'User not found');
    return;
  }

  const property = await Property.findOne({
    _id: user.interestedProperty,
    ...buildManagedPropertyQuery(req.user)
  });

  if (!property) {
    sendError(res, 403, 'Unauthorized to reject for this property');
    return;
  }

  user.status = 'rejected';
  await user.save();

  await createNotification({
    organization: property.organization,
    user: user._id,
    title: 'Application rejected',
    message: `Your application for ${property.name} unit ${user.interestedUnit} was not approved.`,
    type: 'system_notice'
  });

  await logRequestAudit({
    req,
    organization: property.organization,
    action: 'Registration rejected',
    entityType: 'user',
    entityId: user._id,
    metadata: {
      propertyName: property.name,
      summary: `${user.name} • Unit ${user.interestedUnit}`
    }
  });

  res.json({ message: 'User registration rejected' });
};

const deleteProperty = async (req, res) => {
  const propertyId = req.params.id;

  const property = await Property.findOneAndDelete({
    _id: propertyId,
    ...buildManagedPropertyQuery(req.user)
  });

  if (!property) {
    sendError(res, 404, 'Property not found or unauthorized');
    return;
  }

  // Cascading deletions
  await Promise.all([
    Unit.deleteMany({ property: propertyId }),
    Tenant.deleteMany({ property: propertyId }),
    Lease.deleteMany({ property: propertyId }),
    RepairRequest.deleteMany({ propertyId: propertyId })
  ]);

  await logRequestAudit({
    req,
    organization: property.organization,
    action: 'Property deleted',
    entityType: 'property',
    entityId: property._id,
    metadata: {
      propertyName: property.name,
      summary: `${property.name} and all related data deleted`
    }
  });

  res.json({ message: 'Property and all associated data deleted successfully' });
};

const getTenants = async (req, res) => {
  const properties = await Property.find(buildManagedPropertyQuery(req.user));
  const propertyIds = properties.map((p) => p._id);

  const tenants = await Tenant.find({ property: { $in: propertyIds } })
    .populate('user', 'name email phoneNumber')
    .populate('property', 'name')
    .sort({ createdAt: -1 });

  res.json(tenants);
};

const updateTenant = async (req, res) => {
  const { id } = req.params;
  const { rentAmount } = req.body;

  const tenant = await Tenant.findById(id).populate('property');
  if (!tenant) {
    sendError(res, 404, 'Tenant not found');
    return;
  }

  const property = await Property.findOne({
    _id: tenant.property?._id || tenant.property,
    ...buildManagedPropertyQuery(req.user)
  });

  if (!property) {
    sendError(res, 403, 'Unauthorized to update this tenant');
    return;
  }

  const oldRent = tenant.rentAmount;
  tenant.rentAmount = Number(rentAmount);
  await tenant.save();

  // Sync latest unpaid invoice
  const latestInvoice = await Invoice.findOne({
    tenant: tenant._id,
    status: { $in: ['draft', 'sent'] }
  }).sort({ createdAt: -1 });

  if (latestInvoice) {
    latestInvoice.amount = tenant.rentAmount;
    latestInvoice.totalAmount = tenant.rentAmount;
    // Update line items if they contain 'Monthly Rent'
    latestInvoice.lineItems = latestInvoice.lineItems.map(item => {
      if (item.label === 'Monthly Rent') {
        return { ...item, amount: tenant.rentAmount };
      }
      return item;
    });
    await latestInvoice.save();
  }

  await logRequestAudit({
    req,
    organization: tenant.organization,
    action: 'Tenant rent updated',
    entityType: 'tenant',
    entityId: tenant._id,
    metadata: {
      propertyName: property.name,
      oldRent,
      newRent: tenant.rentAmount,
      invoiceUpdated: !!latestInvoice
    }
  });

  res.json({ message: 'Tenant updated successfully', tenant, invoiceUpdated: !!latestInvoice });
};

const activateTenancy = async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await Tenant.findOne({
    _id: tenantId,
    user: req.user.id,
    status: 'pending_activation'
  }).populate('property');

  if (!tenant) {
    sendError(res, 404, 'Tenancy not found or already active');
    return;
  }

  // Check for 1 month expiry manually here or via background job
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  if (tenant.createdAt < oneMonthAgo) {
    tenant.status = 'expired';
    await tenant.save();
    sendError(res, 403, 'Your approval has expired. Please contact management.');
    return;
  }

  tenant.status = 'active';
  tenant.startDate = new Date();
  await tenant.save();

  // Generate first invoice
  const { createRentInvoice } = require('./invoiceController');
  await createRentInvoice(tenant);

  await logRequestAudit({
    req,
    organization: tenant.organization,
    action: 'Tenancy activated',
    entityType: 'tenant',
    entityId: tenant._id,
    metadata: {
      propertyName: tenant.property?.name,
      summary: 'Tenant clicked Start button'
    }
  });

  res.json({ message: 'Tenancy activated successfully', tenant });
};

module.exports = {
  getProperties,
  createProperty,
  updateProperty,
  getPropertyTenants,
  createTenant,
  getPendingRegistrations,
  approveRegistration,
  rejectRegistration,
  deleteProperty,
  getTenants,
  updateTenant,
  activateTenancy
};
