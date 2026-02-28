import { useState, useEffect } from 'react';
import '../../styles/Management.css';

function BoardingRegistrationRequests() {
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedReg, setSelectedReg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const getToken = () => {
    const stored = localStorage.getItem('unihub_user');
    if (!stored) return null;
    try {
      const user = JSON.parse(stored);
      return user.token;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const token = getToken();
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Fetching registrations...');
      const response = await fetch('http://localhost:5000/api/registration/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', errorData);
        throw new Error(errorData.message || `Failed to fetch registrations (Status: ${response.status})`);
      }

      const data = await response.json();
      console.log('Registrations loaded:', data.length);
      setRegistrations(data);
      filterByStatus(data, 'pending');
      setError('');
    } catch (err) {
      setError('Failed to load registrations: ' + err.message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterByStatus = (regs, status) => {
    if (status === 'all') {
      setFilteredRegistrations(regs);
    } else {
      setFilteredRegistrations(regs.filter(reg => reg.status === status));
    }
    setStatusFilter(status);
  };

  const handleStatusChange = (status) => {
    filterByStatus(registrations, status);
  };

  const handleViewDetails = (reg) => {
    setSelectedReg(reg);
    setShowModal(true);
    setRejectionReason('');
  };

  const handleApprove = async () => {
    if (!selectedReg) return;
    
    try {
      setIsProcessing(true);
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/registration/${selectedReg._id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        throw new Error('Failed to approve registration');
      }

      setShowModal(false);
      setSelectedReg(null);
      fetchRegistrations();
      alert('Registration approved successfully!');
    } catch (err) {
      alert('Error approving registration: ' + err.message);
      console.error('Approve error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReg) return;
    
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setIsProcessing(true);
      const token = getToken();
      const response = await fetch(`http://localhost:5000/api/registration/${selectedReg._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason })
      });

      if (!response.ok) {
        throw new Error('Failed to reject registration');
      }

      setShowModal(false);
      setSelectedReg(null);
      setRejectionReason('');
      fetchRegistrations();
      alert('Registration rejected successfully!');
    } catch (err) {
      alert('Error rejecting registration: ' + err.message);
      console.error('Reject error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusStats = () => {
    return {
      pending: registrations.filter(r => r.status === 'pending').length,
      approved: registrations.filter(r => r.status === 'approved').length,
      rejected: registrations.filter(r => r.status === 'rejected').length,
      total: registrations.length
    };
  };

  const stats = getStatusStats();

  if (loading) {
    return (
      <div className="management-container">
        <p>Loading registrations...</p>
      </div>
    );
  }

  return (
    <div className="management-container">
      {error && <div className="error-message">{error}</div>}

      <div className="management-header">
        <h2>Boarding Owner Registration Requests</h2>
        <div className="status-counts">
          <div className="count-badge pending">
            <span className="badge-number">{stats.pending}</span>
            <span className="badge-label">Pending</span>
          </div>
          <div className="count-badge approved">
            <span className="badge-number">{stats.approved}</span>
            <span className="badge-label">Approved</span>
          </div>
          <div className="count-badge rejected">
            <span className="badge-number">{stats.rejected}</span>
            <span className="badge-label">Rejected</span>
          </div>
        </div>
      </div>

      <div className="filter-buttons">
        <button 
          className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => handleStatusChange('pending')}
        >
          Pending ({stats.pending})
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'approved' ? 'active' : ''}`}
          onClick={() => handleStatusChange('approved')}
        >
          Approved ({stats.approved})
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => handleStatusChange('rejected')}
        >
          Rejected ({stats.rejected})
        </button>
        <button 
          className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleStatusChange('all')}
        >
          All ({stats.total})
        </button>
      </div>

      <div className="registrations-list">
        {filteredRegistrations.length === 0 ? (
          <p className="no-data">No {statusFilter === 'all' ? '' : statusFilter} registrations found.</p>
        ) : (
          <div className="registrations-grid">
            {filteredRegistrations.map(reg => (
              <div key={reg._id} className="registration-card">
                <div className="card-header">
                  <h3>{reg.firstName} {reg.lastName}</h3>
                  <span className={`status-badge status-${reg.status}`}>
                    {reg.status?.charAt(0).toUpperCase() + reg.status?.slice(1)}
                  </span>
                </div>
                <div className="card-content">
                  <p><strong>Email:</strong> {reg.email}</p>
                  <p><strong>ID Number:</strong> {reg.idNumber}</p>
                  <p><strong>Business:</strong> {reg.businessName}</p>
                  <p><strong>Location:</strong> {reg.address}, {reg.city}</p>
                  <p><strong>Submitted:</strong> {new Date(reg.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-view-details"
                    onClick={() => handleViewDetails(reg)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal for detailed view and actions */}
      {showModal && selectedReg && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Registration Details</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="details-section">
                <h3>Personal Information</h3>
                <div className="detail-row">
                  <label>Name:</label>
                  <span>{selectedReg.firstName} {selectedReg.lastName}</span>
                </div>
                <div className="detail-row">
                  <label>Email:</label>
                  <span>{selectedReg.email}</span>
                </div>
                <div className="detail-row">
                  <label>ID Number:</label>
                  <span>{selectedReg.idNumber}</span>
                </div>
              </div>

              <div className="details-section">
                <h3>ID Documents</h3>
                <div className="id-images">
                  {selectedReg.idFrontImage && (
                    <div className="image-container">
                      <label>ID Front:</label>
                      <img 
                        src={selectedReg.idFrontImage} 
                        alt="ID Front"
                        style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  {selectedReg.idBackImage && (
                    <div className="image-container">
                      <label>ID Back:</label>
                      <img 
                        src={selectedReg.idBackImage} 
                        alt="ID Back"
                        style={{ maxWidth: '300px', maxHeight: '200px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="details-section">
                <h3>Business Information</h3>
                <div className="detail-row">
                  <label>Business Name:</label>
                  <span>{selectedReg.businessName}</span>
                </div>
                <div className="detail-row">
                  <label>Address:</label>
                  <span>{selectedReg.address}</span>
                </div>
                <div className="detail-row">
                  <label>City:</label>
                  <span>{selectedReg.city}</span>
                </div>
                <div className="detail-row">
                  <label>District:</label>
                  <span>{selectedReg.district}</span>
                </div>
                <div className="detail-row">
                  <label>Total Capacity:</label>
                  <span>{selectedReg.totalCapacity} students</span>
                </div>
                <div className="detail-row">
                  <label>Available Rooms:</label>
                  <span>{selectedReg.availableRooms}</span>
                </div>
                <div className="detail-row">
                  <label>Monthly Rent:</label>
                  <span>PKR {selectedReg.monthlyRent}</span>
                </div>
                <div className="detail-row">
                  <label>Amenities:</label>
                  <span>{selectedReg.amenities?.join(', ') || 'None listed'}</span>
                </div>
              </div>

              {selectedReg.status === 'pending' && (
                <div className="details-section">
                  <h3>Action Required</h3>
                  <div className="form-group">
                    <label>Rejection Reason (if applicable):</label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Leave empty if you plan to approve"
                      rows="3"
                    />
                  </div>
                </div>
              )}

              {selectedReg.status !== 'pending' && (
                <div className="details-section">
                  <h3>Review Information</h3>
                  <div className="detail-row">
                    <label>Status:</label>
                    <span className={`status-badge status-${selectedReg.status}`}>
                      {selectedReg.status?.charAt(0).toUpperCase() + selectedReg.status?.slice(1)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <label>Reviewed By:</label>
                    <span>{selectedReg.reviewedBy?.fullName || 'Unknown'}</span>
                  </div>
                  <div className="detail-row">
                    <label>Review Date:</label>
                    <span>{new Date(selectedReg.reviewedAt).toLocaleDateString()}</span>
                  </div>
                  {selectedReg.rejectionReason && (
                    <div className="detail-row">
                      <label>Rejection Reason:</label>
                      <span>{selectedReg.rejectionReason}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedReg.status === 'pending' ? (
                <>
                  <button 
                    className="btn-approve"
                    onClick={handleApprove}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={handleReject}
                    disabled={isProcessing || !rejectionReason.trim()}
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                </>
              ) : (
                <button 
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardingRegistrationRequests;
