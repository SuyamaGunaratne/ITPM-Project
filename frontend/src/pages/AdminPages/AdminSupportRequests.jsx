import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

function AdminSupportRequests() {
  const [supportRequests, setSupportRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, open, in_progress, resolved, closed

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

  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  useEffect(() => {
    fetchSupportRequests();
  }, []);

  const fetchSupportRequests = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/support', {
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch support requests');
      }

      const data = await response.json();
      setSupportRequests(data);
    } catch (err) {
      setError(err.message || 'Failed to load support requests');
      console.error('Error fetching support requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    setActionLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`http://localhost:5000/api/support/${requestId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: newStatus,
          adminResponse: adminResponse.trim() || undefined
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update support request');
      }

      setSuccess(`Support request ${newStatus.replace('_', ' ')} successfully`);
      setShowModal(false);
      setSelectedRequest(null);
      setAdminResponse('');
      fetchSupportRequests(); // Refresh the list
    } catch (err) {
      setError(err.message || 'Failed to update support request');
      console.error('Error updating support request:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const openResponseModal = (request) => {
    setSelectedRequest(request);
    setAdminResponse(request.adminResponse || '');
    setShowModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'resolved': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'closed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const filteredRequests = supportRequests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-slate-900 dark:text-white mb-2">
            Support Requests Management
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage and respond to student support requests
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Requests', count: supportRequests.length },
              { key: 'open', label: 'Open', count: supportRequests.filter(r => r.status === 'open').length },
              { key: 'in_progress', label: 'In Progress', count: supportRequests.filter(r => r.status === 'in_progress').length },
              { key: 'resolved', label: 'Resolved', count: supportRequests.filter(r => r.status === 'resolved').length },
              { key: 'closed', label: 'Closed', count: supportRequests.filter(r => r.status === 'closed').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  filter === tab.key
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-green-700 dark:text-green-400 font-medium">{success}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Support Requests List */
          <div className="space-y-4">
            {filteredRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📋</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No support requests found
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {filter === 'all' ? 'No support requests have been submitted yet.' : `No ${filter.replace('_', ' ')} support requests.`}
                </p>
              </div>
            ) : (
              filteredRequests.map((request) => (
                <div key={request._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          {request.subject}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ')}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </div>
                      <div className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        <span className="font-medium">From:</span> {request.studentName} ({request.studentEmail})
                        {request.studentId?.course && <span> • Course: {request.studentId.course}</span>}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-500 mb-3">
                        <span className="font-medium">Category:</span> {request.category} •
                        <span className="ml-2">Submitted: {formatDate(request.createdAt)}</span>
                        {request.respondedAt && <span className="ml-2">• Responded: {formatDate(request.respondedAt)}</span>}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                        <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                          {request.message}
                        </p>
                      </div>
                      {request.adminResponse && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-400">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            Admin Response:
                          </p>
                          <p className="text-blue-800 dark:text-blue-200 whitespace-pre-wrap">
                            {request.adminResponse}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {request.status === 'open' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(request._id, 'in_progress')}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                          Mark In Progress
                        </button>
                        <button
                          onClick={() => openResponseModal(request)}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Respond & Resolve
                        </button>
                      </>
                    )}

                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => openResponseModal(request)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Respond & Resolve
                      </button>
                    )}

                    {request.status !== 'closed' && (
                      <button
                        onClick={() => handleStatusUpdate(request._id, 'closed')}
                        disabled={actionLoading}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Close Request
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Response Modal */}
        {showModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-4">
                  Respond to Support Request
                </h2>

                <div className="mb-6">
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                    {selectedRequest.subject}
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 mb-4">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                      {selectedRequest.message}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Your Response
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Provide a helpful response to the student's support request..."
                    rows={6}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-vertical"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusUpdate(selectedRequest._id, 'resolved')}
                    disabled={actionLoading || !adminResponse.trim()}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Processing...
                      </>
                    ) : (
                      'Resolve Request'
                    )}
                  </button>

                  <button
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminSupportRequests;