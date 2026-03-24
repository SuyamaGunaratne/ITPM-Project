import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { studentNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

function StudentSupport() {
  const { modal, closeModal, handleConfirm, showConfirm, showSuccess, showError } = useModal();

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const token = user?.token || null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const [activeTab, setActiveTab] = useState('submit'); // 'submit' or 'requests'
  const [form, setForm] = useState({
    subject: '',
    category: 'technical',
    message: '',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setLoadingRequests(true);
    try {
      const response = await fetch('http://localhost:5000/api/support/my-requests', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMyRequests(data);
      }
    } catch (error) {
      console.error('Error fetching support requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subject.trim() || !form.message.trim()) {
      showError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('http://localhost:5000/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          studentId: user._id,
          studentName: user.fullName || user.name,
          studentEmail: user.email
        }),
      });

      if (response.ok) {
        showSuccess('Support request submitted successfully! Our admin team will get back to you soon.');
        setForm({
          subject: '',
          category: 'technical',
          message: '',
          priority: 'medium'
        });
        fetchMyRequests(); // Refresh the requests list
      } else {
        const error = await response.json();
        showError(error.message || 'Failed to submit support request');
      }
    } catch (error) {
      console.error('Error submitting support request:', error);
      showError('Network error. Please try again later.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout?',
      () => secureLogout()
    );
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
    <DashboardLayout
      role="Student"
      sidebarBrand="UniHub Student"
      sidebarSub="Support Center"
      navItems={studentNavItems}
      activePath="/student/support"
      userName={studentName}
      userAvatar={avatarSrc}
      title="Support Center"
      subtitleText="Get help from our admin team"
      onLogout={handleLogout}
    >
      <div className="max-w-6xl mx-auto">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('submit')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'submit'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Submit Request
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'requests'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              My Requests ({myRequests.length})
            </button>
          </div>
        </div>

        {/* Submit Request Tab */}
        {activeTab === 'submit' && (
          <div className="glass-card rounded-2xl p-6 lg:p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center text-xl">
                🆘
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
                  Contact Admin Support
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Need help? Submit a support request and our admin team will assist you.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your issue"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  >
                    <option value="technical">Technical Issue</option>
                    <option value="account">Account Problem</option>
                    <option value="course">Course Related</option>
                    <option value="boarding">Boarding Related</option>
                    <option value="community">Community Forum</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Priority
                </label>
                <div className="flex gap-4">
                  {[
                    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
                    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
                    { value: 'high', label: 'High', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
                  ].map((priority) => (
                    <label key={priority.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="priority"
                        value={priority.value}
                        checked={form.priority === priority.value}
                        onChange={handleInputChange}
                        className="sr-only"
                      />
                      <span className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                        form.priority === priority.value
                          ? priority.color
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {priority.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Message *
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleInputChange}
                  placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce, or specific questions you have."
                  rows={6}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-vertical"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span>📤</span>
                      Submit Request
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setForm({
                    subject: '',
                    category: 'technical',
                    message: '',
                    priority: 'medium'
                  })}
                  className="px-6 py-3 border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold rounded-xl transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </form>

            <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <span className="text-blue-600 dark:text-blue-400 text-lg">ℹ️</span>
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                    Response Time
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Our admin team typically responds within 24-48 hours. For urgent technical issues, please call the IT support hotline at (011) 123-4567.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
                📋
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">
                  My Support Requests
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Track the status of your submitted support requests
                </p>
              </div>
            </div>

            {loadingRequests ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="glass-card rounded-2xl p-6">
                      <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                  No support requests yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  You haven't submitted any support requests yet.
                </p>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="btn-primary"
                >
                  Submit Your First Request
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div key={request._id} className="glass-card rounded-2xl p-6 hover:shadow-md transition-shadow">
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
                          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border-l-4 border-green-400">
                            <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                              Admin Response:
                            </p>
                            <p className="text-green-800 dark:text-green-200 whitespace-pre-wrap">
                              {request.adminResponse}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        onConfirm={handleConfirm}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
        singleButton={modal.singleButton}
      />
    </DashboardLayout>
  );
}

export default StudentSupport;