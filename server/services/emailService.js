const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { emailHost, emailUser, emailPass, frontendUrl } = require('../config/env');

dotenv.config();

const transporter = nodemailer.createTransport({
  host: emailHost || process.env.EMAIL_HOST,
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: emailUser || process.env.EMAIL_USER,
    pass: emailPass || process.env.EMAIL_PASS,
  },
});

const FRONTEND_URL = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

const sendPaymentConfirmation = async (toEmail, tenantName, amount, receiptNumber) => {
  const mailOptions = {
    from: `"Apex Agencies" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Payment Confirmation - Apex Agencies',
    html: `
      <h2>Payment Received</h2>
      <p>Hello ${tenantName},</p>
      <p>We have successfully received your rent payment of <strong>KSh ${amount}</strong>.</p>
      <p>Mpesa Receipt Number: <strong>${receiptNumber}</strong></p>
      <p>You can view your updated balance and payment history in your dashboard.</p>
      <a href="${FRONTEND_URL}/dashboard" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Go to Dashboard</a>
      <p>Thank you for choosing Apex Agencies.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Email Error:", err);
  }
};

const notifyLandlord = async (landlordEmail, tenantName, amount, unit) => {
  const mailOptions = {
    from: `"Apex Agencies System" <${process.env.EMAIL_USER}>`,
    to: landlordEmail,
    subject: 'Rent Payment Notification',
    html: `
      <h2>New Rent Payment Received</h2>
      <p>Tenant <strong>${tenantName}</strong> from unit <strong>${unit}</strong> has paid <strong>KSh ${amount}</strong>.</p>
      <p>The transaction has been recorded in your dashboard.</p>
      <a href="${FRONTEND_URL}/dashboard" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">View Dashboard</a>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("Landlord Notification Email Error:", err);
  }
};

const sendLandlordWelcome = async (email, name) => {
  const mailOptions = {
    from: `"Apex Agencies" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Apex Agencies - Your Landlord Account',
    html: `
      <h2>Welcome ${name}!</h2>
      <p>Your landlord account has been successfully created.</p>
      <p>You can now start adding your properties and units to the system.</p>
      <a href="${FRONTEND_URL}/login" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Login to Dashboard</a>
    `,
  };
  return transporter.sendMail(mailOptions).catch(err => console.error("Welcome Email Error:", err));
};

const sendPropertyRegistration = async (email, propertyName, unitsCount) => {
  const mailOptions = {
    from: `"Apex Agencies" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Property Registered: ${propertyName}`,
    html: `
      <h2>Property Successfully Registered</h2>
      <p>Your property <strong>${propertyName}</strong> with <strong>${unitsCount}</strong> units has been added to the system.</p>
      <p>Tenants can now apply for these units through the registration portal.</p>
      <a href="${FRONTEND_URL}/dashboard" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Manage Property</a>
    `,
  };
  return transporter.sendMail(mailOptions).catch(err => console.error("Property Email Error:", err));
};

const sendTenantApplicationNotification = async (landlordEmail, tenantName, propertyName, unitNumber) => {
  const mailOptions = {
    from: `"Apex Agencies" <${process.env.EMAIL_USER}>`,
    to: landlordEmail,
    subject: `New Application for ${propertyName}`,
    html: `
      <h2>New Tenant Application</h2>
      <p><strong>${tenantName}</strong> has applied for <strong>Unit ${unitNumber}</strong> at <strong>${propertyName}</strong>.</p>
      <p>Please log in to your dashboard to review and approve the application.</p>
      <a href="${FRONTEND_URL}/dashboard?section=overview" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Manage Applications</a>
    `,
  };
  return transporter.sendMail(mailOptions).catch(err => console.error("Application Email Error:", err));
};

const sendTenantApproval = async (email, tenantName, propertyName, unitNumber) => {
  const mailOptions = {
    from: `"Apex Agencies" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Application has been Approved!',
    html: `
      <h2>Congratulations ${tenantName}!</h2>
      <p>Your application for <strong>Unit ${unitNumber}</strong> at <strong>${propertyName}</strong> has been approved.</p>
      <p>You can now log in to access your tenant dashboard and view your lease details.</p>
      <a href="${FRONTEND_URL}/login" style="padding: 10px 20px; background: #10b981; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
    `,
  };
  return transporter.sendMail(mailOptions).catch(err => console.error("Approval Email Error:", err));
};

const sendRepairRequestNotification = async (landlordEmail, tenantName, propertyName, unit, description) => {
  const mailOptions = {
    from: `"Apex Agencies" <${process.env.EMAIL_USER}>`,
    to: landlordEmail,
    subject: `New Maintenance Request - ${propertyName}`,
    html: `
      <h2>New Maintenance Request</h2>
      <p><strong>${tenantName}</strong> from <strong>Unit ${unit}</strong> has submitted a new request:</p>
      <blockquote style="padding: 10px; background: #f3f4f6; border-left: 4px solid #2563eb;">
        ${description}
      </blockquote>
      <p>Log in to your dashboard to view full details and assign a technician.</p>
      <a href="${FRONTEND_URL}/dashboard?section=repairs" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">View Request</a>
    `,
  };
  return transporter.sendMail(mailOptions).catch(err => console.error("Repair Request Email Error:", err));
};

const sendRepairStatusUpdate = async (tenantEmail, tenantName, propertyName, unit, status, response) => {
  const statusColors = {
    pending: '#f59e0b',
    in_progress: '#3b82f6',
    resolved: '#10b981',
    cancelled: '#ef4444'
  };

  const mailOptions = {
    from: `"Apex Agencies" <${process.env.EMAIL_USER}>`,
    to: tenantEmail,
    subject: `Maintenance Update: ${status.replace('_', ' ')}`,
    html: `
      <h2>Maintenance Request Update</h2>
      <p>Hello ${tenantName}, your request for <strong>Unit ${unit}</strong> at <strong>${propertyName}</strong> is now <strong style="color: ${statusColors[status] || '#2563eb'};">${status.replace('_', ' ')}</strong>.</p>
      ${response ? `<p><strong>Landlord's Note:</strong> ${response}</p>` : ''}
      <p>You can track the progress in your dashboard.</p>
      <a href="${FRONTEND_URL}/dashboard" style="padding: 10px 20px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Dashboard</a>
    `,
  };
  return transporter.sendMail(mailOptions).catch(err => console.error("Repair Update Email Error:", err));
};

module.exports = { 
  sendPaymentConfirmation, 
  notifyLandlord, 
  sendLandlordWelcome, 
  sendPropertyRegistration, 
  sendTenantApplicationNotification, 
  sendTenantApproval,
  sendRepairRequestNotification,
  sendRepairStatusUpdate
};
