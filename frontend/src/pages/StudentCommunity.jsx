import { useEffect, useState, useCallback, useMemo } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
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

  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });
  const [deletePostId, setDeletePostId] = useState(null);

  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    imageData: '',
    imageContentType: '',
    imagePreview: '',
  });

  const [commentInputs, setCommentInputs] = useState({});
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);

  const [user] = useState(() => {
    const stored = window.localStorage.getItem('unihub_user');
    if (!stored) return null;
    try { return JSON.parse(stored); } catch { return null; }
  });

  const token = user?.token || null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const apiHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    Authorization: token ? `Bearer ${token}` : '',
  }), [token]);

  const parseJsonOrText = async (res) => {
    const text = await res.text();
    try { return JSON.parse(text); }
    catch { return { message: text || res.statusText || 'Unexpected response' }; }
  };

  const fetchFeedPosts = useCallback(async () => {
    setLoadingFeed(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/community/posts', { headers: apiHeaders });
      if (!res.ok) { const err = await parseJsonOrText(res); throw new Error(err.message || 'Failed to load community feed'); }
      setFeedPosts(await parseJsonOrText(res));
    } catch (err) { setError(err.message || 'Error loading community feed'); }
    finally { setLoadingFeed(false); }
  }, [apiHeaders]);

  const fetchMyPosts = useCallback(async () => {
    setLoadingMine(true);
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/community/posts/mine', { headers: apiHeaders });
      if (!res.ok) { const err = await parseJsonOrText(res); throw new Error(err.message || 'Failed to load your posts'); }
      setMyPosts(await parseJsonOrText(res));
    } catch (err) { setError(err.message || 'Error loading your posts'); }
    finally { setLoadingMine(false); }
  }, [apiHeaders]);

  useEffect(() => {
    if (!checkAuthAndPreventCaching()) return;
    setupBackButtonProtection();
    if (token) { fetchFeedPosts(); fetchMyPosts(); }
  }, [token, fetchFeedPosts, fetchMyPosts]);

  const setTab = (tab) => { setError(''); setSuccess(''); setActiveTab(tab); };

  const handleLogout = () => {
    showConfirm('Logout Confirmation', 'Are you sure you want to logout?', () => secureLogout());
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) { setNewPost((prev) => ({ ...prev, imageData: '', imageContentType: '', imagePreview: '' })); return; }
    const dataUrl = await toBase64(file);
    const [, base64] = dataUrl.split(',');
    setNewPost((prev) => ({ ...prev, imageData: base64, imageContentType: file.type, imagePreview: dataUrl }));
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (user?.role !== 'student') { setError(`Only students can create community posts.`); return; }
    if (!newPost.title.trim() || !newPost.content.trim()) { setError('Please provide both a title and content.'); return; }
    try {
      setSubmitting(true);
      const body = { title: newPost.title.trim(), content: newPost.content.trim() };
      if (newPost.imageData && newPost.imageContentType) { body.imageData = newPost.imageData; body.imageContentType = newPost.imageContentType; }
      const response = await fetch('http://localhost:5000/api/community/posts', { method: 'POST', headers: apiHeaders, body: JSON.stringify(body) });
      const data = await parseJsonOrText(response);
      if (!response.ok) throw new Error(data.message || 'Failed to submit post.');
      setSuccess(data.message || 'Post submitted and pending approval.');
      setNewPost({ title: '', content: '', imageData: '', imageContentType: '', imagePreview: '' });
      fetchFeedPosts(); fetchMyPosts();
      setActiveTab('feed');
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  };

  const handleToggleLike = async (postId) => {
    setActionLoading(true); setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/community/posts/${postId}/like`, { method: 'PUT', headers: apiHeaders });
      const data = await parseJsonOrText(res);
      if (!res.ok) throw new Error(data.message || 'Failed to update like');
      setFeedPosts((prev) => prev.map((p) => p._id === postId ? { ...p, likesCount: data.likesCount, likedByCurrentUser: data.likedByCurrentUser } : p));
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleCommentChange = (postId, value) => setCommentInputs((prev) => ({ ...prev, [postId]: value }));

  const handleAddComment = async (postId) => {
    const commentText = (commentInputs[postId] || '').trim();
    if (!commentText) { setError('Comment cannot be empty.'); return; }
    setActionLoading(true); setError('');
    try {
      const response = await fetch(`http://localhost:5000/api/community/posts/${postId}/comments`, { method: 'POST', headers: apiHeaders, body: JSON.stringify({ text: commentText }) });
      const data = await parseJsonOrText(response);
      if (!response.ok) throw new Error(data.message || 'Failed to post comment');
      setSuccess('Comment posted successfully.');
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      fetchFeedPosts();
    } catch (err) { setError(err.message); }
    finally { setActionLoading(false); }
  };

  const isOwner = (post) => post?.author?._id === user?._id;

  const handleEditPost = async (post) => {
    const newTitle = window.prompt('Edit post title:', post.title);
    if (newTitle === null) return;
    const newContent = window.prompt('Edit post content:', post.content);
    if (newContent === null) return;
    if (!newTitle.trim() || !newContent.trim()) { setError('Title and content cannot be empty.'); return; }
    try {
      const response = await fetch(`http://localhost:5000/api/community/posts/${post._id}`, { method: 'PUT', headers: apiHeaders, body: JSON.stringify({ title: newTitle.trim(), content: newContent.trim() }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update post');
      setSuccess('Post updated successfully. It may require re-approval.');
      setError('');
      fetchFeedPosts(); fetchMyPosts();
    } catch (err) { setError(err.message || 'Unable to update post'); }
  };

  const handleDeletePost = (postId) => {
    setDeletePostId(postId);
    showConfirm('Delete Post', 'Are you sure you want to delete this post? This action cannot be undone.', async () => {
      try {
        setActionLoading(true);
        const response = await fetch(`http://localhost:5000/api/community/posts/${postId}`, { method: 'DELETE', headers: apiHeaders });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to delete post');
        setToast({ isVisible: true, message: '✓ Post deleted successfully!', type: 'success' });
        setError(''); setDeletePostId(null);
        setTimeout(() => { fetchFeedPosts(); fetchMyPosts(); }, 500);
      } catch (err) {
        setToast({ isVisible: true, message: '✕ ' + (err.message || 'Unable to delete post'), type: 'error' });
      } finally { setActionLoading(false); }
    });
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch { return iso; }
  };

  /* Helper: get initials from name */
  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="home-root teacher-root student-community-root">
      <div className="teacher-layout">

        {/* ── SIDEBAR ── */}
        <aside className="teacher-sidebar">
          <div className="sidebar-header">
            <div className="sidebar-brand">Student Panel</div>
            <p className="sidebar-sub">Community</p>
          </div>
          <nav className="sidebar-nav">
            {[
              { label: 'Dashboard',       href: '/student/dashboard' },
              { label: 'Quizzes',         href: '/student/quizzes' },
              { label: 'Course Materials',href: '/student/materials' },
              { label: 'Community',       href: null, active: true },
              { label: 'Boardings',       href: '/student/boardings' },
              { label: 'Profile',         href: '/student/profile/edit' },
            ].map((item) => (
              <button
                key={item.label}
                className={`sidebar-item${item.active ? ' sidebar-item-active' : ''}`}
                onClick={() => item.href && (window.location.href = item.href)}
              >
                <span className="sidebar-bullet" />
                {item.label}
              </button>
            ))}
            <button className="sidebar-item" onClick={handleLogout}>
              <span className="sidebar-bullet" />
              Logout
            </button>
          </nav>
        </aside>

        {/* ── MAIN ── */}
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
              <img src={avatarSrc} alt="Student profile" className="teacher-avatar" />
            </button>
          </header>

          <div className="management-container" style={{ paddingTop: 0, paddingBottom: 40, background: 'transparent' }}>
            {error   && <div className="error-message">⚠ {error}</div>}
            {success && <div className="success-message">✓ {success}</div>}

            {/* ── TAB BAR ── */}
            <div className="tab-bar">
              {[
                { id: 'share', label: '✏ Share a Concern' },
                { id: 'feed',  label: '🌐 Community Feed' },
                { id: 'mine',  label: '📌 Your Posts' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tab-button${activeTab === t.id ? ' tab-active' : ''}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ══ TAB: SHARE ══ */}
            {activeTab === 'share' && (
              <div className="form-container">
                <h2>Share a Concern</h2>
                <p style={{ fontSize: '0.88rem', color: '#6b7280', marginBottom: 20, marginTop: -10 }}>
                  Posts are reviewed by admin before appearing in the community feed.
                </p>
                <form onSubmit={handleCreatePost}>
                  <div className="form-group">
                    <label htmlFor="postTitle">Title</label>
                    <input
                      id="postTitle" type="text"
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
                      placeholder="Describe your question or concern in detail…"
                      rows={5}
                      value={newPost.content}
                      onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="postImage">Image (optional)</label>
                    <input id="postImage" type="file" accept="image/*" onChange={handleImageChange} />
                    {newPost.imagePreview && (
                      <img
                        src={newPost.imagePreview}
                        alt="Preview"
                        style={{ maxWidth: 240, marginTop: 10, borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)' }}
                      />
                    )}
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Submitting…' : 'Submit for Approval →'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ══ TAB: FEED ══ */}
            {activeTab === 'feed' && (
              <div className="form-container">
                <h2>Community Feed</h2>
                {loadingFeed ? (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading posts…</p>
                ) : feedPosts.length === 0 ? (
                  <p className="no-data">No approved posts yet. Check back later.</p>
                ) : (
                  feedPosts.map((post, i) => (
                    <div
                      key={post._id}
                      className="registration-card"
                      style={{ marginBottom: 20, animationDelay: `${i * 0.06}s` }}
                    >
                      {/* Card header */}
                      <div className="card-header">
                        <div className="card-header-left">
                          <h3>{post.title}</h3>
                          <p className="email">
                            {post.author?.fullName || 'Unknown'} · {formatDate(post.createdAt)}
                          </p>
                        </div>
                        <div className="card-header-right">
                          {isOwner(post) && (
                            <div className="post-actions">
                              <button type="button" className="btn-outline btn-sm" onClick={() => handleEditPost(post)}>Edit</button>
                              <button type="button" className="btn-danger btn-sm" onClick={() => handleDeletePost(post._id)}>Delete</button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card body */}
                      <div className="card-body" style={{ maxHeight: 'unset' }}>
                        <p style={{ whiteSpace: 'pre-wrap', marginBottom: 16, fontSize: '0.92rem', color: '#374151', lineHeight: 1.7 }}>
                          {post.content}
                        </p>

                        {post.image && (
                          <div style={{ marginBottom: 16 }}>
                            <img
                              src={post.image}
                              alt="Post attachment"
                              style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(99,102,241,0.1)' }}
                            />
                          </div>
                        )}

                        {/* Like & comment row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className={post.likedByCurrentUser ? 'btn-liked' : 'btn-like'}
                            onClick={() => handleToggleLike(post._id)}
                            disabled={actionLoading}
                          >
                            {post.likedByCurrentUser ? '♥ Liked' : '♡ Like'} · {post.likesCount || 0}
                          </button>
                          <button
                            type="button"
                            className="btn-like"
                            onClick={() => setActiveCommentPostId(activeCommentPostId === post._id ? null : post._id)}
                          >
                            💬 {post.comments?.length || 0} {post.comments?.length === 1 ? 'reply' : 'replies'}
                          </button>
                        </div>

                        {/* Comment thread */}
                        {activeCommentPostId === post._id && (
                          <div className="sc-comment-thread">
                            {post.comments?.length === 0 ? (
                              <p style={{ color: '#9ca3af', fontSize: '0.87rem' }}>No replies yet. Be the first!</p>
                            ) : (
                              post.comments.map((comment) => (
                                <div key={comment._id} className="sc-comment">
                                  <div className="sc-comment-avatar">
                                    {getInitials(comment.user?.fullName || 'A')}
                                  </div>
                                  <div className="sc-comment-body">
                                    <div className="sc-comment-meta">
                                      <span className="sc-comment-name">{comment.user?.fullName || 'Anonymous'}</span>
                                      <span className="sc-comment-time">· {formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="sc-comment-text">{comment.text}</p>
                                  </div>
                                </div>
                              ))
                            )}

                            <div className="sc-comment-compose">
                              <textarea
                                value={commentInputs[post._id] || ''}
                                onChange={(e) => handleCommentChange(post._id, e.target.value)}
                                placeholder="Write a reply…"
                                rows={2}
                              />
                              <button
                                type="button"
                                className="btn-primary"
                                style={{ padding: '8px 20px', fontSize: '0.85rem' }}
                                disabled={actionLoading}
                                onClick={() => handleAddComment(post._id)}
                              >
                                {actionLoading ? 'Posting…' : 'Post Reply'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ══ TAB: MINE ══ */}
            {activeTab === 'mine' && (
              <div className="form-container">
                <h2>Your Posts</h2>
                {loadingMine ? (
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>Loading your posts…</p>
                ) : myPosts.length === 0 ? (
                  <p className="no-data">You haven't submitted any posts yet. Share a concern to get started.</p>
                ) : (
                  myPosts.map((post, i) => (
                    <div key={post._id} className="registration-card" style={{ marginBottom: 14, animationDelay: `${i * 0.06}s` }}>
                      <div className="card-header">
                        <div className="card-header-left">
                          <h3>{post.title}</h3>
                          <p className="email">Submitted · {formatDate(post.createdAt)}</p>
                        </div>
                        <div className="card-header-right">
                          <span className={`status-badge status-${post.status}`}>{post.status}</span>
                          <div className="post-actions">
                            <button type="button" className="btn-outline btn-sm" onClick={() => handleEditPost(post)}>Edit</button>
                            <button type="button" className="btn-danger btn-sm" onClick={() => handleDeletePost(post._id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                      <div className="card-body" style={{ maxHeight: 'unset' }}>
                        <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem', color: '#374151', lineHeight: 1.7 }}>
                          {post.content}
                        </p>
                        {post.image && (
                          <div style={{ marginTop: 12 }}>
                            <img
                              src={post.image}
                              alt="Post attachment"
                              style={{ width: '100%', maxHeight: 380, objectFit: 'cover', borderRadius: 14, border: '1px solid rgba(99,102,241,0.1)' }}
                            />
                          </div>
                        )}
                        {post.status === 'rejected' && post.reviewReason && (
                          <div className="section rejection" style={{ marginTop: 14 }}>
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

      <Toast
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isVisible: false })}
        duration={4000}
      />
    </div>
  );
}

export default StudentCommunity;