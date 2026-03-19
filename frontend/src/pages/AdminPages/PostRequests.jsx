import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import '../../styles/Management.css';

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
      const response = await fetch('http://localhost:5000/api/community/posts/pending', {
        headers,
      });

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
      <div className="management-container">
        <h1>Student Community Posts</h1>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        {loading ? (
          <p>Loading pending posts…</p>
        ) : posts.length === 0 ? (
          <p className="no-data">No pending posts. Students will see approved threads here once reviewed.</p>
        ) : (
          <div className="registrations-grid">
            {posts.map((post) => (
              <div key={post._id} className="registration-card">
                <div className="card-header">
                  <div>
                    <h3>{post.title}</h3>
                    <p className="email">
                      Posted by {post.author?.fullName || 'Unknown'} • {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <span className="status-badge status-pending">Pending</span>
                </div>
                <div className="card-body">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
                </div>
                <div className="card-footer">
                  <button className="btn-view-details" onClick={() => handleView(post)}>
                    Review Post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && selectedPost && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Review Post</h2>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                <div className="detail-section">
                  <h3>{selectedPost.title}</h3>
                  <p style={{ marginBottom: 10, color: '#555' }}>
                    Posted by <strong>{selectedPost.author?.fullName || 'Unknown'}</strong> on {formatDate(selectedPost.createdAt)}
                  </p>
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedPost.content}</p>
                </div>

                <div className="detail-section">
                  <h3>Review Notes</h3>
                  <div className="form-group">
                    <label>Reason (optional for approval / required for rejection)</label>
                    <textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      rows={4}
                      placeholder="Add a note for the student (required when rejecting)"
                    />
                  </div>
                </div>

                <div className="action-buttons">
                  <button
                    className="btn-approve"
                    onClick={handleApprove}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing…' : 'Approve'}
                  </button>
                  <button
                    className="btn-reject"
                    onClick={handleReject}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing…' : 'Reject'}
                  </button>
                  <button className="btn-close" onClick={closeModal}>
                    Close
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

export default PostRequests;
