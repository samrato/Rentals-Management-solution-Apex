import api from '../lib/api';

export const unitService = {
  async getUnitsByProperty(propertyId) {
    const response = await api.get(`/properties/${propertyId}/units`);
    return response.data;
  }
};
