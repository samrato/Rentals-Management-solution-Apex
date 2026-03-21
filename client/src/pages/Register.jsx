import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Lock, UserPlus, ShieldCheck, Building, Home } from 'lucide-react';
import '../styles/Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'tenant',
    interestedProperty: '',
    interestedUnit: ''
  });
  const [availableProperties, setAvailableProperties] = useState([]);
  const [error, setError] = useState('');
  const [loadingProperties, setLoadingProperties] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAvailableProperties();
  }, []);

  const fetchAvailableProperties = async () => {
    setLoadingProperties(true);
    try {
      const res = await axios.get('/api/auth/properties/available');
      setAvailableProperties(res.data);
    } catch (err) {
      console.error("Failed to fetch properties:", err);
    } finally {
      setLoadingProperties(false);
    }
  };

  const selectedProperty = availableProperties.find(p => p._id === formData.interestedProperty);
  const units = selectedProperty ? selectedProperty.units : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await axios.post('/api/auth/register', formData);
      navigate('/login');
    } catch (err) {
      console.error("Register Error:", err.response?.data);
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Join Apex Agencies property network.</p>
        </div>
        
        {error && <div className="error-msg">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label><User size={14} style={{marginRight: '5px'}}/> Full Name</label>
            <input 
              type="text" 
              placeholder="Amirion Prince"
              value={formData.name} 
              onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group">
            <label><Mail size={14} style={{marginRight: '5px'}}/> Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group">
            <label><Lock size={14} style={{marginRight: '5px'}}/> Password</label>
            <input 
              type="password" 
              placeholder="password"
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              required 
            />
          </div>
          <div className="form-group">
            <label><ShieldCheck size={14} style={{marginRight: '5px'}}/> Account Type</label>
            <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value, interestedProperty: '', interestedUnit: '' })}>
              <option value="tenant">Tenant - Looking for a home</option>
              <option value="landlord">Landlord - Managing properties</option>
            </select>
          </div>

          {formData.role === 'tenant' && (
            <>
              <div className="form-group">
                <label><Building size={14} style={{marginRight: '5px'}}/> Select Property</label>
                {loadingProperties ? <p className="loading-text">Loading available properties...</p> : (
                  <select 
                    value={formData.interestedProperty} 
                    onChange={(e) => setFormData({ ...formData, interestedProperty: e.target.value, interestedUnit: '' })}
                    required
                  >
                    <option value="">-- Choose a Property --</option>
                    {availableProperties.map(p => (
                      <option key={p._id} value={p._id}>{p.name} - {p.address}</option>
                    ))}
                  </select>
                )}
              </div>
              
              {formData.interestedProperty && (
                <div className="form-group">
                  <label><Home size={14} style={{marginRight: '5px'}}/> Select Unit</label>
                  <select 
                    value={formData.interestedUnit} 
                    onChange={(e) => setFormData({ ...formData, interestedUnit: e.target.value })}
                    required
                  >
                    <option value="">-- Choose a Unit --</option>
                    {units.map(u => (
                      <option key={u} value={u}>Unit {u}</option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn-primary w-full" disabled={formData.role === 'tenant' && !formData.interestedUnit}>
            <UserPlus size={18} style={{marginRight: '8px'}}/> {formData.role === 'tenant' ? 'Submit Application' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
