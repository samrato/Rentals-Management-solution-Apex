import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Building, Eye, EyeOff, Home, Lock, Mail, Phone, ShieldCheck, User, UserPlus } from 'lucide-react';
import { useSession } from '../hooks/useSession';
import { showErrorAlert, showToast } from '../lib/alerts';
import { getApiErrorMessage } from '../lib/api';
import { authService } from '../services/authService';
import { formatRoleLabel, ROLES, SELF_SERVICE_REGISTRATION_OPTIONS } from '../utils/roles';
import { formatCurrency } from '../utils/format';
import '../styles/Auth.css';

const roleIcons = {
  [ROLES.TENANT]: Home,
  [ROLES.LANDLORD]: Building,
  [ROLES.PROPERTY_MANAGER]: ShieldCheck
};

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org');
  const { isAuthenticated, loading: sessionLoading } = useSession();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    role: ROLES.TENANT,
    interestedProperty: '',
    interestedUnit: ''
  });
  const [availableProperties, setAvailableProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAvailableProperties(orgId);
  }, [orgId]);

  if (!sessionLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const fetchAvailableProperties = async (organizationId) => {
    setLoadingProperties(true);

    try {
      const properties = await authService.getAvailableProperties(organizationId);
      setAvailableProperties(properties);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Failed to load available properties.'));
    } finally {
      setLoadingProperties(false);
    }
  };

  const selectedProperty = availableProperties.find((property) => property._id === formData.interestedProperty);
  const selectedUnits = selectedProperty?.units || [];

  const handleFieldChange = (field, value) => {
    if (field === 'role' && value !== ROLES.TENANT) {
      setFormData((current) => ({
        ...current,
        role: value,
        interestedProperty: '',
        interestedUnit: ''
      }));
      return;
    }

    setFormData((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await authService.register(formData);
      await showToast({
        icon: 'success',
        title: formData.role === ROLES.TENANT ? 'Application Submitted' : 'Account Created',
        text: response.message || 'Your account request has been received.'
      });
      navigate('/login');
    } catch (requestError) {
      const message = getApiErrorMessage(requestError, 'Registration failed. Please review your details.');
      setError(message);
      await showErrorAlert('Registration Failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page auth-page-split">
      <div className="auth-shell auth-shell-wide">
        <div className="auth-aside glass-card">
          <span className="auth-eyebrow">Account Setup</span>
          <h2>Pick role. Pick place. Apply fast.</h2>
          <p>Clear color shows what is selected.</p>
          <div className="auth-selection-panel">
            <div className="auth-selection-row">
              <span>Role</span>
              <strong>{formatRoleLabel(formData.role)}</strong>
            </div>
            {formData.role === ROLES.TENANT && (
              <>
                <div className="auth-selection-row">
                  <span>Property</span>
                  <strong>{selectedProperty?.name || 'Not selected'}</strong>
                </div>
                <div className="auth-selection-row">
                  <span>Unit</span>
                  <strong>{formData.interestedUnit ? `Unit ${formData.interestedUnit}` : 'Not selected'}</strong>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="auth-card glass-card auth-card-wide">
          <div className="auth-header">
            <h2>Create Account</h2>
            <p>Create your access.</p>
          </div>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label><User size={14} style={{ marginRight: '5px' }} /> Full Name</label>
              <input
                type="text"
                placeholder="Amirion Prince"
                value={formData.name}
                onChange={(event) => handleFieldChange('name', event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label><Mail size={14} style={{ marginRight: '5px' }} /> Email</label>
              <input
                type="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={(event) => handleFieldChange('email', event.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label><Phone size={14} style={{ marginRight: '5px' }} /> Phone</label>
              <input
                type="tel"
                placeholder="2547XXXXXXXX"
                value={formData.phoneNumber}
                onChange={(event) => handleFieldChange('phoneNumber', event.target.value)}
              />
            </div>
            <div className="form-group">
              <label><Lock size={14} style={{ marginRight: '5px' }} /> Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(event) => handleFieldChange('password', event.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label><ShieldCheck size={14} style={{ marginRight: '5px' }} /> Account Type</label>
              <div className="auth-role-grid">
                {SELF_SERVICE_REGISTRATION_OPTIONS.map((option) => {
                  const Icon = roleIcons[option.value] || ShieldCheck;
                  const selected = formData.role === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      className={`auth-role-card ${selected ? 'selected' : ''}`}
                      onClick={() => handleFieldChange('role', option.value)}
                    >
                      <span className="auth-role-icon"><Icon size={18} /></span>
                      <span className="auth-role-title">{option.label}</span>
                      <span className="auth-role-copy">{option.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.role === ROLES.TENANT && (
              <>
                <div className="form-group">
                  <label><Building size={14} style={{ marginRight: '5px' }} /> Property</label>
                  {loadingProperties ? (
                    <p className="loading-text">Loading properties...</p>
                  ) : (
                    <select
                      value={formData.interestedProperty}
                      onChange={(event) => {
                        handleFieldChange('interestedProperty', event.target.value);
                        handleFieldChange('interestedUnit', '');
                      }}
                      required
                    >
                      <option value="">Choose property</option>
                      {availableProperties.map((property) => (
                        <option key={property._id} value={property._id}>
                          {property.name} - {property.address}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {selectedProperty && selectedProperty.images && selectedProperty.images.length > 0 && (
                  <div className="form-group">
                    <label>Property Gallery</label>
                    <div className="auth-property-gallery">
                      {selectedProperty.images.map((image, index) => (
                        <img key={index} src={`/${image}`} alt={`${selectedProperty.name} ${index + 1}`} className="auth-gallery-img" />
                      ))}
                    </div>
                  </div>
                )}

                {formData.interestedProperty && (
                  <div className="form-group">
                    <label><Home size={14} style={{ marginRight: '5px' }} /> Unit</label>
                    <div className="auth-unit-grid">
                      {selectedUnits.length > 0 ? selectedUnits.map((unit) => (
                        <button
                          key={unit}
                          type="button"
                          className={`auth-unit-chip ${formData.interestedUnit === unit ? 'selected' : ''}`}
                          onClick={() => handleFieldChange('interestedUnit', unit)}
                        >
                          <div className="auth-unit-chip-header">
                            <span>Unit {unit}</span>
                          </div>
                          {selectedProperty?.unitDetails?.[unit] && (
                            <div className="auth-unit-chip-meta">
                              <strong>{formatCurrency(selectedProperty.unitDetails[unit].rentAmount)}</strong>
                            </div>
                          )}
                        </button>
                      )) : (
                        <p className="loading-text">No open units.</p>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitting || (formData.role === ROLES.TENANT && !formData.interestedUnit)}
            >
              <UserPlus size={18} style={{ marginRight: '8px' }} />
              {submitting ? 'Submitting...' : formData.role === ROLES.TENANT ? 'Apply' : 'Create Account'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
