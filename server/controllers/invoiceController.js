const { Invoice, Property, Tenant, User } = require('../models');
const { sendError } = require('../helpers/apiResponse');
const { ROLES } = require('../helpers/rbac');

const buildManagedPropertyQuery = (user) => {
  if (user.role === ROLES.SUPER_ADMIN) {
    return {};
  }
  return {
    organization: user.organizationId,
    $or: [{ landlord: user.id }, { manager: user.id }]
  };
};

const getInvoices = async (req, res) => {
  let invoices;

  if ([ROLES.LANDLORD, ROLES.PROPERTY_MANAGER, ROLES.SUPER_ADMIN].includes(req.user.role)) {
    const properties = await Property.find(buildManagedPropertyQuery(req.user));
    const propertyIds = properties.map((p) => p._id);
    
    invoices = await Invoice.find({ property: { $in: propertyIds } })
      .populate('tenant', 'name email')
      .populate('property', 'name')
      .sort({ createdAt: -1 });
  } else {
    // Tenant only sees their own invoices
    const tenantProf = await Tenant.findOne({ user: req.user.id });
    if (!tenantProf) {
       res.json([]);
       return;
    }
    invoices = await Invoice.find({ tenant: tenantProf._id })
      .populate('property', 'name')
      .sort({ createdAt: -1 });
  }

  res.json(invoices);
};

const createRentInvoice = async (tenantOrId, propertyId, amount, dueDate, organization) => {
  let tenant;
  let tId, pId, amt, dDate, org;

  if (typeof tenantOrId === 'object' && tenantOrId._id) {
    // Called with full tenant object
    tenant = tenantOrId;
    tId = tenant._id;
    pId = tenant.property?._id || tenant.property;
    amt = tenant.rentAmount;
    dDate = new Date();
    org = tenant.organization;
  } else {
    // Called with individual params
    tId = tenantOrId;
    pId = propertyId;
    amt = amount;
    dDate = dueDate || new Date();
    org = organization;
    tenant = await Tenant.findById(tId);
  }

  const finalAmount = Number(amt || 0);

  const invoice = new Invoice({
    organization: org,
    tenant: tId,
    property: pId,
    unit: tenant?.unit || 'N/A',
    amount: finalAmount,
    totalAmount: finalAmount,
    dueDate: dDate,
    status: 'sent',
    lineItems: [{ label: 'Monthly Rent', amount: finalAmount }]
  });

  await invoice.save();
  return invoice;
};

const createDepositInvoice = async (tenantId, propertyId, amount, organization) => {
  const tenant = await Tenant.findById(tenantId).populate('user');
  const finalAmount = Number(amount || 0);

  const invoice = new Invoice({
    organization,
    tenant: tenantId,
    property: propertyId,
    unit: tenant?.unit || 'N/A',
    amount: finalAmount,
    totalAmount: finalAmount,
    dueDate: new Date(),
    status: 'sent',
    lineItems: [{ label: 'Security Deposit', amount: finalAmount }]
  });

  await invoice.save();
  return invoice;
};

module.exports = {
  getInvoices,
  createRentInvoice,
  createDepositInvoice
};
