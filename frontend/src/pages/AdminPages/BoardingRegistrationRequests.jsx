import { useState, useEffect } from 'react';
import '../../styles/Management.css';

function BoardingRegistrationRequests() {
  const [registrations, setRegistrations] = useState([]);
  const [filteredRegistrations, setFilteredRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Get token from stored user object
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

  const token = getToken();

  useEffect(() => {
    fetchRegistrations();
  }, []);

  useEffect(() => {
    filterRegistrations();
  }, [filterStatus, registrations]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      console.log('Fetching registrations with token:', token.substring(0, 20) + '...');

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
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load registrations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterRegistrations = () => {
    if (filterStatus === 'all') {
      setFilteredRegistrations(registrations);
    } else {
      setFilteredRegistrations(registrations.filter(r => r.status === filterStatus));
    }
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowDetails(true);
    setRejectionReason('');
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedRegistration(null);
    setRejectionReason('');
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;

    try {
      setActionLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/registration/${selectedRegistration._id}/approve`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) throw new Error('Failed to approve');

      setSuccess('Registration approved successfully! User account created.');
      setTimeout(() => {
        setSuccess('');
        handleCloseDetails();
        fetchRegistrations();
      }, 2000);
    } catch (err) {
      setError('Failed to approve: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration || !rejectionReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/registration/${selectedRegistration._id}/reject`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
        }
      );

      if (!response.ok) throw new Error('Failed to reject');

      setSuccess('Registration rejected successfully.');
      setTimeout(() => {
        setSuccess('');
        handleCloseDetails();
        fetchRegistrations();
      }, 2000);
    } catch (err) {
      setError('Failed to reject: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-pending';
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      default:
        return '';
    }
  };

  if (loading) {
    return <div className="management-container"><p>Loading registration requests...</p></div>;
  }

  return (
    <div className="management-container">
      <h1>Boarding Owner Registration Requests</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Filter Section */}
      <div className="filter-section">
        <label>Filter by Status:</label>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">All Requests ({registrations.length})</option>
          <option value="pending">Pending ({registrations.filter(r => r.status === 'pending').length})</option>
          <option value="approved">Approved ({registrations.filter(r => r.status === 'approved').length})</option>
          <option value="rejected">Rejected ({registrations.filter(r => r.status === 'rejected').length})</option>
        </select>
      </div>

      {/* Registrations List */}
      {filteredRegistrations.length === 0 ? (
        <p className="no-data">No registration requests found.</p>
      ) : (
        <div className="registrations-grid">
          {filteredRegistrations.map((reg) => (
            <div key={reg._id} className="registration-card">
              <div className="card-header">
                <div>
                  <h3>{reg.firstName} {reg.lastName}</h3>
                  <p className="email">{reg.email}</p>
                </div>
                <span className={`status-badge ${getStatusBadgeClass(reg.status)}`}>
                  {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
                </span>
              </div>

              <div className="card-body">
                <div className="section">
                  <h4>Personal Information</h4>
                  <p><strong>ID Number:</strong> {reg.idNumber}</p>
                  <p><strong>Submitted:</strong> {new Date(reg.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="section">
                  <h4>Business Information</h4>
                  <p><strong>Business Name:</strong> {reg.businessName}</p>
                  <p><strong>Location:</strong> {reg.address}, {reg.city}, {reg.district}</p>
                  {reg.monthlyRent && <p><strong>Monthly Rent:</strong> PKR {reg.monthlyRent}</p>}
                  {reg.totalCapacity && <p><strong>Total Capacity:</strong> {reg.totalCapacity} students</p>}
                </div>

                {reg.status === 'rejected' && reg.rejectionReason && (
                  <div className="section rejection">
                    <h4>Rejection Reason</h4>
                    <p>{reg.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="card-footer">
                <button
                  className="btn-view-details"
                  onClick={() => handleViewDetails(reg)}
                >
                  View & Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {showDetails && selectedRegistration && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Review Registration Request</h2>
              <button className="modal-close" onClick={handleCloseDetails}>×</button>
            </div>

            <div className="modal-body">
              {/* Personal Details Section */}
              <div className="detail-section">
                <h3>Personal Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>First Name</label>
                    <p>{selectedRegistration.firstName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Last Name</label>
                    <p>{selectedRegistration.lastName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Email</label>
                    <p>{selectedRegistration.email}</p>
                  </div>
                  <div className="detail-item">
                    <label>ID Number</label>
                    <p>{selectedRegistration.idNumber}</p>
                  </div>
                </div>

                {/* ID Images */}
                <div className="id-images">
                  <div className="id-image">
                    <label>ID Front Image</label>
                    {selectedRegistration.idFrontImage && (
                      <img src={selectedRegistration.idFrontImage} alt="ID Front" />
                    )}
                  </div>
                  <div className="id-image">
                    <label>ID Back Image</label>
                    {selectedRegistration.idBackImage && (
                      <img src={selectedRegistration.idBackImage} alt="ID Back" />
                    )}
                  </div>
                </div>
              </div>

              {/* Business Details Section */}
              <div className="detail-section">
                <h3>Business Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <label>Business Name</label>
                    <p>{selectedRegistration.businessName}</p>
                  </div>
                  <div className="detail-item">
                    <label>Address</label>
                    <p>{selectedRegistration.address}</p>
                  </div>
                  <div className="detail-item">
                    <label>City</label>
                    <p>{selectedRegistration.city}</p>
                  </div>
                  <div className="detail-item">
                    <label>District</label>
                    <p>{selectedRegistration.district}</p>
                  </div>
                  <div className="detail-item">
                    <label>Monthly Rent</label>
                    <p>{selectedRegistration.monthlyRent ? `PKR ${selectedRegistration.monthlyRent}` : 'Not specified'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Total Capacity</label>
                    <p>{selectedRegistration.totalCapacity || 'Not specified'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Available Rooms</label>
                    <p>{selectedRegistration.availableRooms || 'Not specified'}</p>
                  </div>
                  <div className="detail-item">
                    <label>Amenities</label>
                    <p>{selectedRegistration.amenities?.length > 0 ? selectedRegistration.amenities.join(', ') : 'None specified'}</p>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="detail-section">
                <h3>Registration Status</h3>
                <p><strong>Current Status:</strong> <span className={`status-badge ${getStatusBadgeClass(selectedRegistration.status)}`}>{selectedRegistration.status.toUpperCase()}</span></p>
                <p><strong>Submitted:</strong> {new Date(selectedRegistration.createdAt).toLocaleString()}</p>
                {selectedRegistration.reviewedAt && (
                  <p><strong>Reviewed:</strong> {new Date(selectedRegistration.reviewedAt).toLocaleString()}</p>
                )}
              </div>

              {/* Action Section - Only for Pending */}
              {selectedRegistration.status === 'pending' && (
                <div className="detail-section action-section">
                  <h3>Admin Action</h3>
                  {selectedRegistration.status === 'pending' && (
                    <>
                      <div className="form-group">
                        <label>Notes (Optional)</label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add any notes about this registration"
                          rows="3"
                        />
                      </div>

                      <div className="form-group">
                        <label>Rejection Reason (if rejecting)</label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why you are rejecting this registration"
                          rows="3"
                        />
                      </div>

                      <div className="action-buttons">
                        <button
                          className="btn-approve"
                          onClick={handleApprove}
                          disabled={actionLoading}
                        >
                          {actionLoading ? 'Processing...' : '✓ Approve'}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={handleReject}
                          disabled={actionLoading || !rejectionReason.trim()}
                        >
                          {actionLoading ? 'Processing...' : '✗ Reject'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-close" onClick={handleCloseDetails}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BoardingRegistrationRequests;
