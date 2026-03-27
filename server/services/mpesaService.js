const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();
const shortCode = (process.env.MPESA_SHORTCODE || '').trim();
const passkey = (process.env.MPESA_PASSKEY || '').trim();
const callbackUrl = (process.env.MPESA_CALLBACK_URL || '').trim();

const getAccessToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  try {
    const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
      headers: { Authorization: `Basic ${auth}` }
    });
    return res.data.access_token;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error("Mpesa Auth Error Details:", JSON.stringify(errorData, null, 2));
    throw new Error(`Failed to get Mpesa access token: ${errorData.errorMessage || err.message}`);
  }
};

const initiateSTKPush = async (phoneNumber, amount, accountReference) => {
  const token = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[-:T.]/g, '').slice(0, 14);
  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

  const data = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: "CustomerPayBillOnline",
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortCode,
    PhoneNumber: phoneNumber,
    CallBackURL: callbackUrl,
    AccountReference: accountReference,
    TransactionDesc: "Rent Payment"
  };

  try {
    const res = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err) {
    const errorData = err.response?.data || err.message;
    console.error("STK Push Error Details:", JSON.stringify(errorData, null, 2));
    throw new Error(`Failed to initiate STK Push: ${errorData.errorMessage || err.message}`);
  }
};

module.exports = { initiateSTKPush };
