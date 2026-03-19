import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';
import '../styles/HomePage.css';
import '../styles/Management.css';

function StudentCommunity() {
  const { modal, closeModal, handleConfirm, showConfirm } = useModal();

  const [activeTab, setActiveTab] = useState('feed');
  const [feedPosts, setFeedPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);

  const [loadingFeed, setLoadingFeed] = useState(true);
  const [loadingMine, setLoadingMine] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    imageData: '',
    imageContentType: '',
    imagePreview: '',
  });

  const [commentInputs, setCommentInputs] = useState({});

  const [user, setUser] = useState(() => {
    const stored = window.localStorage.getItem('unihub_user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });

  const token = user?.token || null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const apiHeaders = {
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  };

  useEffect(() => {
    if (!checkAuthAndPreventCaching()) return;
    setupBackButtonProtection();
    if (token) {
      fetchFeedPosts();
      fetchMyPosts();
    }
  }, [token]);

  const parseJsonOrText = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return { message: text || res.statusText || 'Unexpected response' };
    }
  };

  const fetchFeedPosts = async () => {
    setLoadingFeed(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/community/posts', { headers: apiHeaders });
      if (!res.ok) {
        const err = await parseJsonOrText(res);
        throw new Error(err.message || 'Failed to load community feed');
      }
      const data = await parseJsonOrText(res);
      setFeedPosts(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading community feed');
    } finally {
      setLoadingFeed(false);
    }
  };

  const fetchMyPosts = async () => {
    setLoadingMine(true);
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/community/posts/mine', { headers: apiHeaders });
      if (!res.ok) {
        const err = await parseJsonOrText(res);
        throw new Error(err.message || 'Failed to load your posts');
      }
      const data = await parseJsonOrText(res);
      setMyPosts(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error loading your posts');
    } finally {
      setLoadingMine(false);
    }
  };

  const setTab = (tab) => {
    setError('');
    setSuccess('');
    setActiveTab(tab);
  };

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => {
        secureLogout();
      }
    );
  };

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setNewPost((prev) => ({ ...prev, imageData: '', imageContentType: '', imagePreview: '' }));
      return;
    }

    const dataUrl = await toBase64(file);
    const [, base64] = dataUrl.split(',');

    setNewPost((prev) => ({
      ...prev,
      imageData: base64,
      imageContentType: file.type,
      imagePreview: dataUrl,
    }));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (user?.role !== 'student') {
      setError(`Only students can create community posts. You are currently logged in as ${user?.role || 'unknown'}.`);
      return;
    }

    if (!newPost.title.trim() || !newPost.content.trim()) {
      setError('Please provide both a title and content for your post.');
      return;
    }

    try {
      setSubmitting(true);

      const body = {
        title: newPost.title.trim(),
        content: newPost.content.trim(),
      };

      if (newPost.imageData && newPost.imageContentType) {
        body.imageData = newPost.imageData;
        body.imageContentType = newPost.imageContentType;
      }

      const response = await fetch('http://localhost:5000/api/community/posts', {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify(body),
      });

      const data = await parseJsonOrText(response);
      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit post.');
      }

      setSuccess(data.message || 'Post submitted and pending approval.');
      setNewPost({ title: '', content: '', imageData: '', imageContentType: '', imagePreview: '' });
      fetchFeedPosts();
      fetchMyPosts();
      setActiveTab('feed');
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleLike = async (postId) => {
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}/like`, {
        method: 'PUT',
        headers: apiHeaders,
      });

      const data = await parseJsonOrText(res);
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update like');
      }

      setFeedPosts((prev) =>
        prev.map((p) =>
          p._id === postId
            ? { ...p, likesCount: data.likesCount, likedByCurrentUser: data.likedByCurrentUser }
            : p
        )
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCommentChange = (postId, value) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  const handleAddComment = async (postId) => {
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) {
      setError('Comment cannot be empty.');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`http://localhost:5000/api/community/posts/${postId}/comments`, {
        method: 'POST',
        headers: apiHeaders,
        body: JSON.stringify({ text: commentText }),
      });

      const data = await parseJsonOrText(response);
      if (!response.ok) {
        throw new Error(data.message || 'Failed to post comment');
      }

      setSuccess('Comment posted successfully.');
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      fetchFeedPosts();
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
    <div className="home-root teacher-root">
      <div className="teacher-layout">
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Student Panel</div>
            <p className="sidebar-sub">Community</p>
          </div>

          <nav className="sidebar-nav">
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/dashboard')}
            >
              <span className="sidebar-bullet" />
              Dashboard
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/quizzes')}
            >
              <span className="sidebar-bullet" />
              Quizzes
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/materials')}
            >
              <span className="sidebar-bullet" />
              Course Materials
            </button>
            <button className="sidebar-item sidebar-item-active">
              <span className="sidebar-bullet" />
              Community
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/boardings')}
            >
              <span className="sidebar-bullet" />
              Boardings
            </button>
            <button
              className="sidebar-item"
              onClick={() => (window.location.href = '/student/profile/edit')}
            >
              <span className="sidebar-bullet" />
              Profile
            </button>
            <button className="sidebar-item" onClick={handleLogout}>
              <span className="sidebar-bullet" />
              Logout
            </button>
          </nav>
        </aside>

        <main className="teacher-main">
          <header className="teacher-topbar">
            <div>
              <h1 className="teacher-title">Student Community</h1>
              <p className="teacher-subtitle">
                Discussions and announcements for <span>{studentName}</span>.
              </p>
            </div>
            <button
              className="teacher-avatar-btn"
              onClick={() => (window.location.href = '/student/profile/edit')}
              title="Edit your profile"
            >
              <img
                src={avatarSrc}
                alt="Student profile"
                className="teacher-avatar"
              />
            </button>
          </header>

          <div className="management-container" style={{ paddingTop: 20, paddingBottom: 40 }}>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <div className="tab-bar">
              <button
                type="button"
                className={`tab-button ${activeTab === 'share' ? 'tab-active' : ''}`}
                onClick={() => setTab('share')}
              >
                Share a Concern
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === 'feed' ? 'tab-active' : ''}`}
                onClick={() => setTab('feed')}
              >
                Community Feed
              </button>
              <button
                type="button"
                className={`tab-button ${activeTab === 'mine' ? 'tab-active' : ''}`}
                onClick={() => setTab('mine')}
              >
                Your Posts
              </button>
            </div>

            {activeTab === 'share' && (
              <div className="form-container">
                <h2>Share a Concern (Pending Admin Approval)</h2>
                <form onSubmit={handleCreatePost}>
                  <div className="form-group">
                    <label htmlFor="postTitle">Title</label>
                    <input
                      id="postTitle"
                      type="text"
                      placeholder="Short summary of your concern"
                      value={newPost.title}
                      onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postContent">Details</label>
                    <textarea
                      id="postContent"
                      placeholder="Describe your question or concern in detail"
                      rows={5}
                      value={newPost.content}
                      onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postImage">Image (optional)</label>
                    <input
                      id="postImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {newPost.imagePreview && (
                      <img
                        src={newPost.imagePreview}
                        alt="Preview"
                        style={{ maxWidth: '240px', marginTop: 12, borderRadius: 10 }}
                      />
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting…' : 'Submit for Approval'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'feed' && (
              <div className="form-container">
                <h2>Community Feed</h2>
                {loadingFeed ? (
                  <p>Loading posts…</p>
                ) : feedPosts.length === 0 ? (
                  <p className="no-data">No approved posts yet. Check back later.</p>
                ) : (
                  feedPosts.map((post) => (
                    <div key={post._id} className="registration-card" style={{ marginBottom: 18 }}>
                      <div className="card-header" style={{ alignItems: 'flex-start' }}>
                        <div>
                          <h3>{post.title}</h3>
                          <p className="email">
                            Posted by {post.author?.fullName || 'Unknown'} • {formatDate(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="card-body" style={{ maxHeight: 'unset' }}>
                        <p style={{ whiteSpace: 'pre-wrap', marginBottom: 16 }}>{post.content}</p>
                        {post.image && (
                          <div style={{ marginBottom: 16 }}>
                            <img
                              src={post.image}
                              alt="Post"
                              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 10 }}
                            />
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 12,
                            flexWrap: 'wrap',
                          }}
                        >
                          <button
                            type="button"
                            className={post.likedByCurrentUser ? 'btn-liked' : 'btn-like'}
                            onClick={() => handleToggleLike(post._id)}
                            disabled={actionLoading}
                          >
                            {post.likedByCurrentUser ? '♥ Liked' : '♡ Like'} ({post.likesCount || 0})
                          </button>
                        </div>

                        <div style={{ marginTop: 16 }}>
                          <h4 style={{ margin: '0 0 10px 0' }}>Comments</h4>
                          {post.comments?.length === 0 ? (
                            <p style={{ color: '#555' }}>No comments yet. Be the first to reply.</p>
                          ) : (
                            post.comments.map((comment) => (
                              <div
                                key={comment._id}
                                style={{
                                  marginBottom: 12,
                                  padding: 10,
                                  background: '#f7f8ff',
                                  borderRadius: 8,
                                }}
                              >
                                <p style={{ margin: 0, fontSize: 13, color: '#333' }}>
                                  <strong>{comment.user?.fullName || 'Anonymous'}</strong> •{' '}
                                  {formatDate(comment.createdAt)}
                                </p>
                                <p
                                  style={{
                                    margin: '6px 0 0 0',
                                    whiteSpace: 'pre-wrap',
                                    color: '#444',
                                  }}
                                >
                                  {comment.text}
                                </p>
                              </div>
                            ))
                          )}

                          <div style={{ marginTop: 12 }}>
                            <textarea
                              value={commentInputs[post._id] || ''}
                              onChange={(e) => handleCommentChange(post._id, e.target.value)}
                              placeholder="Write a reply..."
                              rows={2}
                              style={{
                                width: '100%',
                                borderRadius: 8,
                                border: '1px solid #ccc',
                                padding: 10,
                                resize: 'vertical',
                              }}
                            />
                            <button
                              type="button"
                              className="btn-primary"
                              style={{ marginTop: 10 }}
                              disabled={actionLoading}
                              onClick={() => handleAddComment(post._id)}
                            >
                              {actionLoading ? 'Posting…' : 'Post Comment'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'mine' && (
              <div className="form-container">
                <h2>Your Posts</h2>
                {loadingMine ? (
                  <p>Loading your posts…</p>
                ) : myPosts.length === 0 ? (
                  <p className="no-data">You haven’t submitted any posts yet. Share a concern to get started.</p>
                ) : (
                  myPosts.map((post) => (
                    <div key={post._id} className="registration-card" style={{ marginBottom: 12 }}>
                      <div className="card-header" style={{ alignItems: 'flex-start' }}>
                        <div>
                          <h3>{post.title}</h3>
                          <p className="email">
                            Submitted on {formatDate(post.createdAt)}
                          </p>
                        </div>
                        <span className={`status-badge status-${post.status}`}>{post.status}</span>
                      </div>
                      <div className="card-body" style={{ maxHeight: 'unset' }}>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
                        {post.image && (
                          <div style={{ marginTop: 12 }}>
                            <img
                              src={post.image}
                              alt="Post"
                              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 10 }}
                            />
                          </div>
                        )}
                        {post.status === 'rejected' && post.reviewReason && (
                          <div className="section rejection">
                            <h4>Admin Feedback</h4>
                            <p>{post.reviewReason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </main>
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
    </div>
  );
}

export default StudentCommunity;

