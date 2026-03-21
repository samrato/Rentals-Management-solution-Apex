import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Home, Users, Bell, MessageCircle, Sparkles, Plus, MapPin, DollarSign, Calendar, Wrench, FileText, Upload, Download, Building } from 'lucide-react';
import '../styles/Dashboard.css';
import Landing from './Landing';

const StatCard = ({ icon, label, value, subtext, color = 'var(--primary)', highlight = false }) => (
  <div className={`stat-card glass-card ${highlight ? 'highlight-pulse' : ''}`}>
    <div className="stat-icon" style={{ background: `${color}20`, color }}>
      {icon}
    </div>
    <div className="stat-info">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-subtext" style={highlight ? { color: 'var(--primary)', fontWeight: 'bold' } : {}}>{subtext}</div>
    </div>
  </div>
);

const RepairSection = ({ requests, isLandlord = false, onUpdate, showForm, setShowForm, newRepair, setNewRepair, onSubmit, properties }) => (
  <section className="repair-section">
    <div className="section-header">
      <h2><Wrench size={20} /> Repair Requests</h2>
      {!isLandlord && <button onClick={() => setShowForm(true)} className="btn-primary"><Plus size={18} /> New Request</button>}
    </div>

    {showForm && (
      <div className="repair-form glass-card">
        <h3>Submit Repair Request</h3>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label>Description of Issue</label>
            <textarea value={newRepair.description} onChange={e => setNewRepair({...newRepair, description: e.target.value})} placeholder="Describe the problem..." required></textarea>
          </div>
          <div className="form-group">
            <label>Property & Unit</label>
            <div className="flex gap-2">
              <select value={newRepair.propertyId} onChange={e => setNewRepair({...newRepair, propertyId: e.target.value})} required>
                <option value="">Select Property</option>
                {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <input type="text" placeholder="Unit" value={newRepair.unit} onChange={e => setNewRepair({...newRepair, unit: e.target.value})} required />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">Submit Request</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    )}

    <div className="repair-grid">
      {requests.length > 0 ? requests.map(r => (
        <div key={r._id} className={`repair-item glass-card status-${r.status}`}>
          <div className="repair-header">
            <span className={`status-badge ${r.status}`}>{r.status}</span>
            <span className="date">{new Date(r.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="repair-body">
            {isLandlord && <p className="description"><strong>Tenant:</strong> {r.tenant?.name} ({r.unit})</p>}
            <p className="description">{r.description}</p>
            {r.landlordResponse && (
              <div className="response-box">
                <strong>Management Response:</strong>
                <p>{r.landlordResponse}</p>
                {r.technicianDetails && <p className="tech text-sm mt-1">Tech: {r.technicianDetails}</p>}
              </div>
            )}
          </div>
          {isLandlord && r.status === 'pending' && (
            <div className="repair-footer">
              <button 
                onClick={() => {
                  const resp = prompt("Enter response/action taken:");
                  const tech = prompt("Enter technician contact (optional):");
                  if (resp) onUpdate(r._id, 'in-progress', resp, tech);
                }} 
                className="btn-secondary"
              >
                Mark In-Progress
              </button>
              <button 
                onClick={() => onUpdate(r._id, 'resolved', 'Fixed and completed.')} 
                className="btn-primary"
              >
                Resolve
              </button>
            </div>
          )}
        </div>
      )) : (
        <div className="empty-state glass-card">
          <p>No repair requests found.</p>
        </div>
      )}
    </div>
  </section>
);

const LandlordView = ({ 
  properties, onGenerateReminder, repairRequests, onUpdateRepair, payments, user, 
  leases, showLeaseForm, setShowLeaseForm, newLease, setNewLease, onLeaseUpload,
  showPropertyForm, setShowPropertyForm, newProperty, setNewProperty, onPropertySubmit,
  selectedPropertyUnits, setSelectedPropertyUnits, editingPropertyId, setEditingPropertyId,
  pendingRegistrations, handleApproveRegistration, handleRejectRegistration, approvalLoading,
  suggestions
}) => (
  <div className="landlord-dash">
    {pendingRegistrations.length > 0 && (
      <div className="alert-box glass-card animate-bounce-subtle">
        <Sparkles size={20} className="text-yellow-500" />
        <div>
          <strong>Action Required:</strong> You have {pendingRegistrations.length} new tenant application(s) awaiting your review.
        </div>
      </div>
    )}

    {pendingRegistrations.length > 0 && (
      <section className="pending-approvals-section">
        <div className="section-header">
          <h2><Users size={20} className="text-secondary" /> Pending Registrations</h2>
          <span className="badge">{pendingRegistrations.length} new</span>
        </div>
        <div className="pending-grid">
          {pendingRegistrations.map(reg => (
            <div key={reg._id} className="pending-item glass-card colored-border">
              <div className="pending-user-info">
                <h3>{reg.name}</h3>
                <p>{reg.email}</p>
                <div className="selection-badge">
                  <Building size={14} /> Applying for : <strong>Unit {reg.interestedUnit}</strong> at {reg.interestedProperty?.name}
                </div>
              </div>
              <div className="pending-actions">
                <button 
                  onClick={() => handleApproveRegistration(reg._id)} 
                  className="btn-primary btn-sm"
                  disabled={approvalLoading === reg._id}
                >
                  {approvalLoading === reg._id ? '...' : 'Accept'}
                </button>
                <button 
                  onClick={() => handleRejectRegistration(reg._id)} 
                  className="btn-secondary btn-sm"
                  disabled={approvalLoading === reg._id}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}

    <div className="dash-grid">
      <StatCard 
        icon={<Home />} 
        label="Properties" 
        value={properties.length} 
        subtext={pendingRegistrations.length > 0 ? `${pendingRegistrations.length} new applications!` : "Active listings"} 
        highlight={pendingRegistrations.length > 0}
      />
      <StatCard icon={<Users />} label="Tenants" value={leases.length} subtext="Signed agreements" color="var(--secondary)" />
      <StatCard icon={<DollarSign />} label="Collection" value={`KSh ${payments.reduce((acc, p) => acc + (p.status === 'paid' ? p.amount : 0), 0).toLocaleString()}`} subtext="Received this month" color="#10b981" />
      <StatCard icon={<FileText />} label="Leases" value={leases.length} subtext="Total Leases" color="var(--accent)" />
    </div>

    <section className="lease-section">
      <div className="section-header">
        <h2><FileText size={20} /> Lease Management</h2>
        <button onClick={() => setShowLeaseForm(true)} className="btn-primary"><Upload size={18} /> Upload Lease</button>
      </div>

      {showLeaseForm && (
        <div className="repair-form glass-card">
          <h3>Upload Digital Lease</h3>
          <form onSubmit={onLeaseUpload}>
            <div className="form-group">
              <label>Tenant ID (or select from list)</label>
              <input type="text" placeholder="Tenant User ID" value={newLease.tenantId} onChange={e => setNewLease({...newLease, tenantId: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Property & Unit</label>
              <div className="flex gap-2">
                <select value={newLease.propertyId} onChange={e => setNewLease({...newLease, propertyId: e.target.value})} required>
                  <option value="">Select Property</option>
                  {properties.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <input type="text" placeholder="Unit (e.g. 4B)" value={newLease.unit} onChange={e => setNewLease({...newLease, unit: e.target.value})} required />
              </div>
            </div>
            <div className="form-group">
              <label>Lease Document (PDF/Image)</label>
              <input type="file" onChange={e => setNewLease({...newLease, file: e.target.files[0]})} required />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">Upload Agreement</button>
              <button type="button" onClick={() => setShowLeaseForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="repair-grid">
        {leases.length > 0 ? leases.map(l => (
          <div key={l._id} className="repair-item glass-card">
            <div className="repair-header">
              <span className="status-badge resolved">Active</span>
              <span className="date">{new Date(l.uploadedAt).toLocaleDateString()}</span>
            </div>
            <div className="repair-body">
              <p><strong>Tenant:</strong> {l.tenant?.name}</p>
              <p><strong>Property:</strong> {l.property?.name} ({l.unit})</p>
              <p className="description">{l.fileName}</p>
            </div>
            <div className="repair-footer">
              <a href={`/api/leases/view/${l._id}`} target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2">
                <Download size={16} /> View Document
              </a>
            </div>
          </div>
        )) : <p className="empty-msg">No leases uploaded yet.</p>}
      </div>
    </section>

    <section className="payment-history-section">
      <div className="section-header">
        <h2><DollarSign size={20} /> Recent Payments</h2>
      </div>
      <div className="payment-grid glass-card">
        {payments.length > 0 ? (
          <table className="payment-table">
            <thead>
              <tr>
                <th>Tenant</th>
                <th>Unit</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p._id}>
                  <td>{p.tenant?.user?.name}</td>
                  <td>{p.tenant?.unit}</td>
                  <td>KSh {p.amount.toLocaleString()}</td>
                  <td><span className={`status-badge ${p.status}`}>{p.status}</span></td>
                  <td>{p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty-msg">No recent payments recorded.</p>}
      </div>
    </section>

    <section className="property-section">
      <div className="section-header">
        <h2>Your Portfolio</h2>
        <button onClick={() => setShowPropertyForm(true)} className="btn-primary"><Plus size={18} /> Add Property</button>
      </div>

      {showPropertyForm && (
        <div className="repair-form glass-card">
          <h3>{editingPropertyId ? 'Edit Property & Units' : 'Add New Property'}</h3>
          <form onSubmit={onPropertySubmit}>
            <div className="form-group">
              <label>Property Name</label>
              <input 
                type="text" 
                placeholder="e.g. Sunset Meadows" 
                value={newProperty.name} 
                onChange={e => setNewProperty({...newProperty, name: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input 
                type="text" 
                placeholder="e.g. 123 Street, Nairobi" 
                value={newProperty.address} 
                onChange={e => setNewProperty({...newProperty, address: e.target.value})} 
                required 
              />
            </div>
            <div className="form-group">
              <label>Units (comma separated, e.g. 1A, 2B, 3C)</label>
              <input 
                type="text" 
                placeholder="e.g. 101, 102, 103" 
                value={newProperty.units} 
                onChange={e => setNewProperty({...newProperty, units: e.target.value})} 
                required 
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-primary">{editingPropertyId ? 'Save Changes' : 'Add Property'}</button>
              <button type="button" onClick={() => {
                setShowPropertyForm(false);
                setEditingPropertyId(null);
                setNewProperty({ name: '', address: '', units: '' });
              }} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="property-grid">
        {properties.length > 0 ? properties.map(p => (
          <div key={p._id} className="property-item glass-card">
            <div className="property-header">
              <MapPin size={20} className="text-primary" />
              <h4>{p.name}</h4>
            </div>
            <p className="address">{p.address}</p>
            <div className="property-footer">
              <button onClick={() => setSelectedPropertyUnits(p)} className="btn-secondary">View Units</button>
              <button 
                onClick={() => {
                  setEditingPropertyId(p._id);
                  setNewProperty({ name: p.name, address: p.address, units: p.units?.join(', ') || '' });
                  setShowPropertyForm(true);
                }} 
                className="btn-secondary"
              >
                Edit
              </button>
              <button onClick={() => onGenerateReminder('mock_id')} className="btn-ai">
                <Sparkles size={16} /> AI Reminder
              </button>
            </div>
          </div>
        )) : (
          <div className="empty-state glass-card">
            <p>No properties listed yet. Start by adding your first one!</p>
          </div>
        )}
      </div>
    </section>

    {selectedPropertyUnits && (
      <div className="modal-overlay">
        <div className="payment-modal glass-card">
          <div className="section-header">
            <h3>Units for {selectedPropertyUnits.name}</h3>
            <button onClick={() => setSelectedPropertyUnits(null)} className="btn-secondary">Close</button>
          </div>
          <div className="unit-grid-modal" style={{ marginTop: '20px' }}>
            {selectedPropertyUnits.units && selectedPropertyUnits.units.length > 0 ? (
              <div className="units-list-tags" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {selectedPropertyUnits.units.map((u, i) => (
                  <span key={i} className="unit-tag glass-card" style={{ padding: '8px 12px', borderRadius: '8px', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Home size={14} /> Unit {u}
                  </span>
                ))}
              </div>
            ) : (
              <p className="empty-msg">No units defined for this property.</p>
            )}
          </div>
        </div>
      </div>
    )}

    <section className="suggestions-section">
      <div className="section-header">
        <h2><MessageCircle size={20} /> Tenant Suggestions</h2>
        <span className="badge">{suggestions.length} total</span>
      </div>
      <div className="suggestions-grid">
        {suggestions.length > 0 ? suggestions.map(s => (
          <div key={s._id} className="suggestion-item glass-card">
            <div className="suggestion-header">
              <span className="property-tag"><Building size={14} /> {s.property?.name}</span>
              <span className="date">{new Date(s.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="suggestion-content">{s.content}</p>
          </div>
        )) : <p className="empty-msg">No suggestions received yet.</p>}
      </div>
    </section>

    <RepairSection 
      requests={repairRequests} 
      isLandlord={true} 
      onUpdate={onUpdateRepair} 
    />
  </div>
);

const TenantView = ({ 
  repairRequests, showForm, setShowForm, newRepair, setNewRepair, onSubmit, properties,
  payments, phoneNumber, setPhoneNumber, showPaymentModal, setShowPaymentModal,
  selectedRentAmount, setSelectedRentAmount, handleMpesaPayment, paymentLoading, user,
  leases, handleSendSuggestion, suggestionContent, setSuggestionContent, suggestionLoading
}) => (
  <div className="tenant-dash">
    <div className="dash-grid">
      <StatCard icon={<Home />} label="My Unit" value={leases[0] ? `Unit ${leases[0].unit}` : 'Assigning...'} subtext={leases[0]?.property?.name || 'Pending lease'} />
      <StatCard icon={<Calendar />} label="Next Payment" value="Pending" subtext="Check lease agreement" color="var(--secondary)" />
      <StatCard icon={<DollarSign />} label="Rent Amount" value={payments[0] ? `KSh ${payments[0].amount.toLocaleString()}` : 'Refer to Lease'} subtext="Monthly rate" color="#10b981" />
      <StatCard icon={<MessageCircle />} label="Messages" value="Community" subtext="Join the conversation" color="var(--accent)" />
    </div>

    <section className="suggestion-box-section glass-card">
      <div className="section-header">
        <h3><Sparkles size={20} className="text-secondary" /> Suggestions Box</h3>
        <p>Send an anonymous suggestion to your landlord.</p>
      </div>
      <form onSubmit={handleSendSuggestion} className="suggestion-form">
        <textarea 
          placeholder="Share your thoughts or ideas anonymously..." 
          value={suggestionContent}
          onChange={e => setSuggestionContent(e.target.value)}
          required
        ></textarea>
        <button type="submit" className="btn-primary" disabled={suggestionLoading || !suggestionContent.trim()}>
          {suggestionLoading ? 'Sending...' : 'Send Anonymously'}
        </button>
      </form>
    </section>

    <section className="payment-actions glass-card">
      <div className="payment-header">
        <h3><DollarSign size={20} /> Rent Payment</h3>
        <p>Pay your rent securely via M-Pesa</p>
      </div>
      <div className="payment-body">
        <div className="amount-display">
          <span>Amount Due:</span>
          <h2>KSh {payments[0]?.amount?.toLocaleString() || '---'}</h2>
        </div>
        <button 
          onClick={() => {
            setSelectedRentAmount(payments[0]?.amount || 0);
            setShowPaymentModal(true);
          }} 
          className="btn-primary"
          disabled={!payments[0]}
        >
          {payments[0] ? 'Pay with M-Pesa' : 'No Invoice Found'}
        </button>
      </div>
    </section>

    {showPaymentModal && (
      <div className="modal-overlay">
        <div className="payment-modal glass-card">
          <h3>M-Pesa Checkout</h3>
          <p>Enter your phone number to receive the STK Push</p>
          <div className="form-group">
            <label>Phone Number</label>
            <input 
              type="text" 
              placeholder="e.g. 2547XXXXXXXX" 
              value={phoneNumber} 
              onChange={e => setPhoneNumber(e.target.value)} 
            />
          </div>
          <div className="modal-actions">
            <button onClick={handleMpesaPayment} className="btn-primary" disabled={paymentLoading}>
              {paymentLoading ? 'Processing...' : 'Send STK Push'}
            </button>
            <button onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      </div>
    )}

    <section className="tenant-details">
      <div className="section-header">
        <h2><FileText size={20} /> My Lease Agreement</h2>
      </div>
      <div className="details-grid">
        {leases.length > 0 ? (
          <div className="detail-card glass-card w-full">
            <h4>{leases[0].property?.name} - Unit {leases[0].unit}</h4>
            <p>Uploaded on {new Date(leases[0].uploadedAt).toLocaleDateString()}</p>
            <div className="flex gap-4 mt-4">
              <a href={`/api/leases/view/${leases[0]._id}`} target="_blank" rel="noreferrer" className="btn-primary flex items-center gap-2">
                <FileText size={18} /> View Agreement
              </a>
              <a href={`/api/leases/view/${leases[0]._id}`} download className="btn-secondary flex items-center gap-2">
                <Download size={18} /> Download
              </a>
            </div>
          </div>
        ) : (
          <div className="detail-card glass-card w-full opacity-50">
            <p>Your lease agreement has not been uploaded yet. Please contact your landlord.</p>
          </div>
        )}
      </div>
    </section>

    <RepairSection 
      requests={repairRequests} 
      isLandlord={false} 
      showForm={showForm}
      setShowForm={setShowForm}
      newRepair={newRepair}
      setNewRepair={setNewRepair}
      onSubmit={onSubmit}
      properties={properties}
    />
  </div>
);

const Dashboard = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [repairRequests, setRepairRequests] = useState([]);
  const [showRepairForm, setShowRepairForm] = useState(false);
  const [newRepair, setNewRepair] = useState({ description: '', propertyId: '', unit: '', image: null });
  const [payments, setPayments] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedRentAmount, setSelectedRentAmount] = useState(0);
  const [leases, setLeases] = useState([]);
  const [showLeaseForm, setShowLeaseForm] = useState(false);
  const [newLease, setNewLease] = useState({ tenantId: '', propertyId: '', unit: '', file: null });
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [newProperty, setNewProperty] = useState({ name: '', address: '', units: '' });
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [selectedPropertyUnits, setSelectedPropertyUnits] = useState(null);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [approvalLoading, setApprovalLoading] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionContent, setSuggestionContent] = useState('');
  const [suggestionLoading, setSuggestionLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'landlord') {
        fetchProperties();
        fetchRepairs();
        fetchPayments();
        fetchLeases();
        fetchPendingRegistrations();
        fetchSuggestions();
      } else {
        fetchRepairs();
        fetchPayments();
        fetchLeases();
        setLoading(false);
      }
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const res = await axios.get('/api/payments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPayments(res.data);
    } catch (err) {
      console.error("Failed to fetch payments:", err);
    }
  };

  const handleMpesaPayment = async () => {
    if (!phoneNumber) return alert("Please enter your phone number");
    setPaymentLoading(true);
    try {
      await axios.post('/api/payments/stkpush', {
        amount: selectedRentAmount,
        phoneNumber,
        tenantId: user.tenantId || user.id
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("STK Push initiated! Please check your phone to complete the payment.");
      setShowPaymentModal(false);
    } catch (err) {
      alert("Payment initiation failed: " + (err.response?.data?.error || err.message));
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchRepairs = async () => {
    try {
      const res = await axios.get('/api/repairs', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setRepairRequests(res.data);
    } catch (err) {
      console.error("Failed to fetch repairs:", err);
    }
  };

  const fetchProperties = async () => {
    try {
      const res = await axios.get('/api/properties', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setProperties(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeases = async () => {
    try {
      const endpoint = user.role === 'landlord' ? '/api/leases/landlord' : '/api/leases/tenant';
      const res = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setLeases(user.role === 'landlord' ? res.data : [res.data].filter(Boolean));
    } catch (err) {
      console.error("Failed to fetch leases:", err);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const res = await axios.get('/api/pending-registrations', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPendingRegistrations(res.data);
    } catch (err) {
      console.error("Failed to fetch pending registrations:", err);
    }
  };

  const handleApproveRegistration = async (userId) => {
    const rentAmount = prompt("Enter monthly rent amount for this tenant (KSh):", "45000");
    if (rentAmount === null) return;
    
    setApprovalLoading(userId);
    try {
      await axios.post(`/api/approve-registration/${userId}`, { rentAmount: Number(rentAmount) }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Tenant approved successfully!");
      fetchPendingRegistrations();
      fetchProperties();
    } catch (err) {
      alert("Approval failed: " + (err.response?.data?.message || err.message));
    } finally {
      setApprovalLoading(null);
    }
  };

  const handleRejectRegistration = async (userId) => {
    if (!window.confirm("Are you sure you want to reject this application?")) return;
    
    setApprovalLoading(userId);
    try {
      await axios.post(`/api/reject-registration/${userId}`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Application rejected.");
      fetchPendingRegistrations();
    } catch (err) {
      alert("Rejection failed: " + (err.response?.data?.message || err.message));
    } finally {
      setApprovalLoading(null);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const res = await axios.get('/api/suggestions', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSuggestions(res.data);
    } catch (err) {
      console.error("Failed to fetch suggestions:", err);
    }
  };

  const handleSendSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestionContent.trim()) return;
    setSuggestionLoading(true);
    try {
      await axios.post('/api/suggestions', { content: suggestionContent }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("Your suggestion has been sent anonymously!");
      setSuggestionContent('');
    } catch (err) {
      alert("Failed to send suggestion: " + (err.response?.data?.message || err.message));
    } finally {
      setSuggestionLoading(false);
    }
  };

  const handleLeaseUpload = async (e) => {
    e.preventDefault();
    if (!newLease.file) return alert("Please select a file");
    
    const formData = new FormData();
    formData.append('lease', newLease.file);
    formData.append('tenantId', newLease.tenantId);
    formData.append('propertyId', newLease.propertyId);
    formData.append('unit', newLease.unit);

    try {
      await axios.post('/api/leases/upload', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      alert("Lease uploaded successfully!");
      setShowLeaseForm(false);
      fetchLeases();
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.error || err.message));
    }
  };

  const handlePropertySubmit = async (e) => {
    e.preventDefault();
    try {
      const propertyData = {
        ...newProperty,
        units: newProperty.units.split(',').map(u => u.trim()).filter(Boolean)
      };
      
      if (editingPropertyId) {
        await axios.put(`/api/properties/${editingPropertyId}`, propertyData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert("Property updated successfully!");
      } else {
        await axios.post('/api/properties', propertyData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        alert("Property added successfully!");
      }
      
      setShowPropertyForm(false);
      setEditingPropertyId(null);
      setNewProperty({ name: '', address: '', units: '' });
      fetchProperties();
    } catch (err) {
      console.error("Save Property Error:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      alert("Failed to save property: " + msg);
    }
  };

  const generateAIReminder = async (tenantId) => {
    try {
      const res = await axios.post('/api/reminders/generate', { tenantId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      alert("AI Reminder Drafted: " + res.data.reminderText);
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI reminder.");
    }
  };

  const submitRepairRequest = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('description', newRepair.description);
    formData.append('propertyId', newRepair.propertyId);
    formData.append('unit', newRepair.unit);
    if (newRepair.image) formData.append('image', newRepair.image);

    try {
      await axios.post('/api/repairs', formData, {
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setShowRepairForm(false);
      setNewRepair({ description: '', propertyId: '', unit: '', image: null });
      fetchRepairs();
      alert("Repair request submitted successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to submit repair request.");
    }
  };

  const updateRepairStatus = async (id, status, response = '', tech = '') => {
    try {
      await axios.put(`/api/repairs/${id}`, { status, landlordResponse: response, technicianDetails: tech }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchRepairs();
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return <Landing />;

  if (user.role === 'tenant' && user.status === 'pending') {
    return (
      <div className="dashboard-container pending-view">
        <div className="pending-card glass-card">
          <Sparkles size={48} className="pending-icon animate-pulse" />
          <h1>Application Pending</h1>
          <p>Your registration request for <strong>{user.interestedProperty?.name || 'the selected property'}</strong>, Unit <strong>{user.interestedUnit}</strong> is currently being reviewed by the landlord.</p>
          <p className="subtext">You will have full access once your application is approved.</p>
          <button onClick={() => window.location.reload()} className="btn-secondary mt-4">Check Status</button>
        </div>
      </div>
    );
  }

  if (user.role === 'tenant' && user.status === 'rejected') {
    return (
      <div className="dashboard-container pending-view">
        <div className="pending-card glass-card">
          <Bell size={48} className="text-red-500" />
          <h1>Application Rejected</h1>
          <p>We're sorry, but your registration request has been rejected by the landlord.</p>
          <p className="subtext">Please contact the management for more details.</p>
          <button onClick={() => { localStorage.clear(); window.location.href = '/register'; }} className="btn-primary mt-4">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dash-header">
        <div className="header-text">
          <h1>Welcome, {user.name}</h1>
          <p>{user.role === 'landlord' ? 'Manage your real estate empire with ease.' : 'Everything you need for your comfortable stay.'}</p>
        </div>
        <div className="header-badge glass-card">
          <span className="role-tag">{user.role}</span>
        </div>
      </header>

      {user.role === 'landlord' ? (
        <LandlordView 
          properties={properties} 
          onGenerateReminder={generateAIReminder} 
          repairRequests={repairRequests}
          onUpdateRepair={updateRepairStatus}
          user={user}
          leases={leases}
          showLeaseForm={showLeaseForm}
          setShowLeaseForm={setShowLeaseForm}
          newLease={newLease}
          setNewLease={setNewLease}
          onLeaseUpload={handleLeaseUpload}
          payments={payments}
          showPropertyForm={showPropertyForm}
          setShowPropertyForm={setShowPropertyForm}
          newProperty={newProperty}
          setNewProperty={setNewProperty}
          onPropertySubmit={handlePropertySubmit}
          selectedPropertyUnits={selectedPropertyUnits}
          setSelectedPropertyUnits={setSelectedPropertyUnits}
          editingPropertyId={editingPropertyId}
          setEditingPropertyId={setEditingPropertyId}
          pendingRegistrations={pendingRegistrations}
          handleApproveRegistration={handleApproveRegistration}
          handleRejectRegistration={handleRejectRegistration}
          approvalLoading={approvalLoading}
          suggestions={suggestions}
        />
      ) : (
        <TenantView 
          repairRequests={repairRequests}
          showForm={showRepairForm}
          setShowForm={setShowRepairForm}
          newRepair={newRepair}
          setNewRepair={setNewRepair}
          onSubmit={submitRepairRequest}
          properties={properties}
          payments={payments}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          showPaymentModal={showPaymentModal}
          setShowPaymentModal={setShowPaymentModal}
          selectedRentAmount={selectedRentAmount}
          setSelectedRentAmount={setSelectedRentAmount}
          handleMpesaPayment={handleMpesaPayment}
          paymentLoading={paymentLoading}
          user={user}
          leases={leases}
          handleSendSuggestion={handleSendSuggestion}
          suggestionContent={suggestionContent}
          setSuggestionContent={setSuggestionContent}
          suggestionLoading={suggestionLoading}
        />
      )}
    </div>
  );
};

export default Dashboard;
