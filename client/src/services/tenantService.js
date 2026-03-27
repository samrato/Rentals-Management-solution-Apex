import api from '../lib/api';

export const tenantService = {
  async getTenants() {
    const response = await api.get('/tenants');
    return response.data;
  },
  async activateTenancy(tenantId) {
    const response = await api.put(`/tenants/activate/${tenantId}`);
    return response.data;
  },
  async updateTenant(id, data) {
    const response = await api.put(`/tenants/${id}`, data);
    return response.data;
  }
};
