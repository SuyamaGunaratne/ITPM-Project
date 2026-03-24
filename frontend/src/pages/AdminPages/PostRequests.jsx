import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

function PostRequests() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
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

  const getUserRole = () => {
    const stored = localStorage.getItem('unihub_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored).role;
    } catch {
      return null;
    }
  };

  const token = getToken();
  const userRole = (getUserRole() || '').toString().toLowerCase();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  useEffect(() => {
    fetchPendingPosts();
  }, []);

  const fetchPendingPosts = async () => {
    setLoading(true);
    setError('');

    if (!token) {
      setError('Authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    if (userRole !== 'admin') {
      setError('Only admins can access this page. Please login with an admin account.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/community/posts/pending', { headers });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to load pending posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (post) => {
    setSelectedPost(post);
    setReviewReason('');
    setShowModal(true);
    setSuccess('');
  };

  const closeModal = () => {
    setSelectedPost(null);
    setShowModal(false);
    setReviewReason('');
  };

  const handleApprove = async () => {
    if (!selectedPost) return;

    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:5000/api/community/posts/${selectedPost._id}/approve`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reviewReason: reviewReason.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to approve');
      }

      setSuccess('Post approved successfully.');
      setTimeout(() => {
        closeModal();
        fetchPendingPosts();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedPost) return;
    if (!reviewReason.trim()) {
      setError('Please provide a reason for rejection.');
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`http://localhost:5000/api/community/posts/${selectedPost._id}/reject`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ reviewReason: reviewReason.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to reject');
      }

      setSuccess('Post rejected successfully.');
      setTimeout(() => {
        closeModal();
        fetchPendingPosts();
      }, 1200);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <AdminLayout
      title="Community Post Approvals"
      subtitle="Review and moderate student community posts"
      activePath="/admin/post-requests"
    >
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-2">Student Community Posts</h1>

        {error && <div className="p-4 text-sm font-medium text-red-800 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400">⚠ {error}</div>}
        {success && <div className="p-4 text-sm font-medium text-green-800 bg-green-100 rounded-xl dark:bg-green-900/30 dark:text-green-400">✓ {success}</div>}

        {loading ? (
          <div className="animate-pulse space-y-4 py-4">
            {[1, 2].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
          </div>
        ) : posts.length === 0 ? (
          <div className="glass-card p-10 rounded-2xl text-center mt-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No pending posts</h3>
            <p className="text-slate-500 text-sm mt-2">Students will see approved threads here once reviewed.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {posts.map((post) => (
              <div key={post._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                  <div>
                    <h3 className="font-heading font-bold text-lg text-slate-900 dark:text-white mb-1 line-clamp-1">{post.title}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Posted by {post.author?.fullName || 'Unknown'} • {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400 shrink-0 ml-4 border border-yellow-200 dark:border-yellow-700/50">
                    Pending
                  </span>
                </div>
                <div className="p-6 flex-1">
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap line-clamp-4">{post.content}</p>
                </div>
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-right mt-auto">
                  <button className="btn-outline py-2 px-4 shadow-sm text-sm" onClick={() => handleView(post)}>
                    Review Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && selectedPost && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={closeModal}>
            <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-dark-border m-auto relative" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
                <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white">Review Post</h2>
                <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors" onClick={closeModal}>
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/50">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{selectedPost.title}</h3>
                  <p className="text-sm font-medium text-slate-500 mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                    Posted by <strong className="text-slate-700 dark:text-slate-300">{selectedPost.author?.fullName || 'Unknown'}</strong> on {formatDate(selectedPost.createdAt)}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">{selectedPost.content}</p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Review Notes</h3>
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Reason (optional for approval / required for rejection)</label>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      rows={4}
                      placeholder="Add a note for the student (required when rejecting)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all resize-y"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 mt-8 pt-6 border-t border-slate-200 dark:border-slate-800">
                <button className="btn-outline py-2.5 px-6 order-last sm:order-first" onClick={closeModal}>
                  Cancel
                </button>
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
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing…' : '✗ Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default PostRequests;
