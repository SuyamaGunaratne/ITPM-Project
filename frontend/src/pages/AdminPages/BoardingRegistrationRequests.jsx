import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';

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
      const response = await fetch('http://localhost:5000/api/registration/admin/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to fetch registrations (Status: ${response.status})`);
      }
      const data = await response.json();
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
      const response = await fetch(`http://localhost:5000/api/registration/${selectedRegistration._id}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
      const response = await fetch(`http://localhost:5000/api/registration/${selectedRegistration._id}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ rejectionReason: rejectionReason.trim() })
      });
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

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-700/50">Pending</span>;
      case 'approved':
        return <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 border border-green-200 dark:border-green-700/50">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border border-red-200 dark:border-red-700/50">Rejected</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Boarding Owner Registrations" subtitle="Review and manage boarding owner applications" activePath="/admin/boarding-registrations">
        <div className="animate-pulse space-y-4 py-4">
          <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
          <div className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl w-full"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Boarding Owner Registrations" subtitle="Review and manage boarding owner applications" activePath="/admin/boarding-registrations">
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">Registration Requests</h1>

        {error && <div className="p-4 text-sm font-medium text-red-800 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400">⚠ {error}</div>}
        {success && <div className="p-4 text-sm font-medium text-green-800 bg-green-100 rounded-xl dark:bg-green-900/30 dark:text-green-400">✓ {success}</div>}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 gap-4">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Filter by Status:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none text-slate-900 dark:text-white"
          >
            <option value="all">All Requests ({registrations.length})</option>
            <option value="pending">Pending ({registrations.filter(r => r.status === 'pending').length})</option>
            <option value="approved">Approved ({registrations.filter(r => r.status === 'approved').length})</option>
            <option value="rejected">Rejected ({registrations.filter(r => r.status === 'rejected').length})</option>
          </select>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl text-center mt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No registration requests found.</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRegistrations.map((reg) => (
              <div key={reg._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col overflow-hidden">
                <div className="px-5 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-heading font-bold text-slate-900 dark:text-white mb-1 line-clamp-1">{reg.firstName} {reg.lastName}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">{reg.email}</p>
                  </div>
                  {getStatusBadge(reg.status)}
                </div>

                <div className="p-5 flex-1 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Personal</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">ID:</strong> {reg.idNumber}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Submitted:</strong> {new Date(reg.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Business</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Name:</strong> {reg.businessName}</p>
                    <p className="text-sm text-slate-700 dark:text-slate-300"><strong className="text-slate-900 dark:text-slate-100">Loc:</strong> {reg.city}, {reg.district}</p>
                  </div>

                  {reg.status === 'rejected' && reg.rejectionReason && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20">
                      <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-1">Rejection Reason</h4>
                      <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{reg.rejectionReason}</p>
                    </div>
                  )}
                </div>

                <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <button className="w-full btn-outline py-2 text-sm shadow-sm" onClick={() => handleViewDetails(reg)}>
                    View & Review
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showDetails && selectedRegistration && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={handleCloseDetails}>
            <div className="bg-white dark:bg-dark-card w-full max-w-4xl rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-dark-border m-auto relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Review Registration Request</h2>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onClick={handleCloseDetails}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">First Name</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.firstName}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Last Name</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.lastName}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email</label>
                      <p className="font-medium text-slate-900 dark:text-white truncate" title={selectedRegistration.email}>{selectedRegistration.email}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">ID Number</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.idNumber}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">ID Front Image</label>
                      {selectedRegistration.idFrontImage ? (
                        <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                          <img src={selectedRegistration.idFrontImage} alt="ID Front" className="w-full h-full object-cover" />
                        </div>
                      ) : <div className="aspect-video w-full rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">No Image</div>}
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">ID Back Image</label>
                      {selectedRegistration.idBackImage ? (
                         <div className="aspect-video w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                           <img src={selectedRegistration.idBackImage} alt="ID Back" className="w-full h-full object-cover" />
                         </div>
                      ) : <div className="aspect-video w-full rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">No Image</div>}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Business Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 lg:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Business Name</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.businessName}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 lg:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Address</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.address}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">City</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.city}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">District</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.district}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Capacity</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.totalCapacity || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Available Rooms</label>
                      <p className="font-medium text-slate-900 dark:text-white">{selectedRegistration.availableRooms || 'N/A'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Monthly Rent</label>
                      <p className="font-medium text-primary-600 dark:text-primary-400">{selectedRegistration.monthlyRent ? `PKR ${selectedRegistration.monthlyRent}` : 'Not specified'}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50 sm:col-span-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Amenities</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedRegistration.amenities?.length > 0 ? (
                           selectedRegistration.amenities.map(a => (
                             <span key={a} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-xs font-medium rounded-md text-slate-700 dark:text-slate-300">{a}</span>
                           ))
                        ) : <span className="text-slate-400">None specified</span>}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Registration Status</h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-wrap gap-6 items-center">
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Current Status</span>
                      {getStatusBadge(selectedRegistration.status)}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Submitted</span>
                      <p className="font-medium text-slate-900 dark:text-white">{new Date(selectedRegistration.createdAt).toLocaleString()}</p>
                    </div>
                    {selectedRegistration.reviewedAt && (
                      <div>
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Reviewed</span>
                        <p className="font-medium text-slate-900 dark:text-white">{new Date(selectedRegistration.reviewedAt).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedRegistration.status === 'pending' && (
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 pb-2 border-b border-slate-100 dark:border-slate-800">Admin Action</h3>
                    <div className="space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Notes (Optional)</label>
                        <textarea
                          value={adminNotes}
                          onChange={(e) => setAdminNotes(e.target.value)}
                          placeholder="Add any internal notes about this registration"
                          rows="2"
                          className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:border-dark-border dark:text-white transition-all resize-y"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Rejection Reason (if rejecting)</label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Explain why you are rejecting this registration"
                          rows="3"
                          className="w-full px-4 py-3 bg-white dark:bg-dark-bg border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:border-dark-border dark:text-white transition-all resize-y"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button className="btn-outline py-2.5 px-6 order-last sm:order-first" onClick={handleCloseDetails}>
                  Close
                </button>
                {selectedRegistration.status === 'pending' && (
                  <>
                    <button
                      className="px-6 py-2.5 font-semibold rounded-xl bg-green-50 text-green-700 hover:bg-green-100 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 border border-transparent shadow-sm transition-colors"
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Processing…' : '✓ Approve'}
                    </button>
                    <button
                      className="px-6 py-2.5 font-semibold rounded-xl bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 border border-transparent shadow-sm transition-colors"
                      onClick={handleReject}
                      disabled={actionLoading || !rejectionReason.trim()}
                    >
                      {actionLoading ? 'Processing…' : '✗ Reject'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default BoardingRegistrationRequests;
