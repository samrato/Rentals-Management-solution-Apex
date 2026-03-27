export const formatCurrency = (amount, currency = 'KSh') => {
  const numericAmount = Number(amount || 0);
  return `${currency} ${numericAmount.toLocaleString()}`;
};

export const formatDate = (value, fallback = '-') => {
  if (!value) {
    return fallback;
  }

  return new Date(value).toLocaleDateString();
};

export const formatMpesaPhoneNumber = (number = '') => {
  let cleaned = String(number).replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.length === 9) {
    cleaned = '254' + cleaned;
  } else if (cleaned.length === 10 && cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  }
  
  return cleaned;
};
