const mongoose = require('mongoose');

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['landlord', 'tenant'], default: 'tenant' },
  status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
  interestedProperty: { type: mongoose.Schema.Types.ObjectId, ref: 'Property' },
  interestedUnit: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Property Schema
const propertySchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  description: { type: String },
  landlord: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  units: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

// Tenant Schema (Link User to Unit)
const tenantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  unit: { type: String, required: true },
  rentAmount: { type: Number, required: true },
  dueDate: { type: Number, default: 1 }, // Day of the month
  status: { type: String, enum: ['active', 'defaulted', 'moved_out'], default: 'active' },
  startDate: { type: Date, default: Date.now }
});

// Payment Schema
const paymentSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'KSh' },
  status: { type: String, enum: ['paid', 'pending', 'overdue', 'failed'], default: 'pending' },
  paymentDate: { type: Date },
  dueDate: { type: Date, required: true },
  mpesaTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'MpesaTransaction' }
});

// Mpesa Transaction Schema
const mpesaTransactionSchema = new mongoose.Schema({
  merchantRequestId: { type: String },
  checkoutRequestId: { type: String, unique: true },
  phoneNumber: { type: String },
  amount: { type: Number },
  mpesaReceiptNumber: { type: String },
  transactionDate: { type: Date },
  resultCode: { type: Number },
  resultDesc: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Message Schema (for Community Chat)
const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Repair Request Schema
const repairRequestSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  unit: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'in-progress', 'resolved'], default: 'pending' },
  landlordResponse: { type: String },
  technicianDetails: { type: String },
  imagePath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Lease Agreement Schema
const leaseSchema = new mongoose.Schema({
  tenant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  unit: { type: String, required: true },
  filePath: { type: String, required: true },
  fileName: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
});

// Anonymous Suggestion Schema
const suggestionSchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Property: mongoose.model('Property', propertySchema),
  Tenant: mongoose.model('Tenant', tenantSchema),
  Payment: mongoose.model('Payment', paymentSchema),
  MpesaTransaction: mongoose.model('MpesaTransaction', mpesaTransactionSchema),
  Message: mongoose.model('Message', messageSchema),
  RepairRequest: mongoose.model('RepairRequest', repairRequestSchema),
  Lease: mongoose.model('Lease', leaseSchema),
  Suggestion: mongoose.model('Suggestion', suggestionSchema)
};
