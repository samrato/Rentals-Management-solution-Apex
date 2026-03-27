import api from '../lib/api';

export const invoiceService = {
  async getInvoices() {
    const response = await api.get('/invoices');
    return response.data;
  }
};
