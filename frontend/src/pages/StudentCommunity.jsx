import { useEffect, useState, useCallback, useMemo } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import DashboardLayout from '../components/DashboardLayout';
import { studentNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

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

  const getInitials = (name = '') => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      <DashboardLayout
        role="Student"
        sidebarBrand="UniHub Student"
        sidebarSub="Community"
        navItems={studentNavItems}
        activePath="/student/community"
        userName={studentName}
        userAvatar={avatarSrc}
        title="Student Community"
        subtitleText={`Discussions and announcements for ${studentName}.`}
        onLogout={handleLogout}
      >
        <div className="w-full">
          {error && <div className="p-4 mb-6 text-sm font-medium text-red-800 bg-red-100 rounded-xl dark:bg-red-900/30 dark:text-red-400">⚠ {error}</div>}
          {success && <div className="p-4 mb-6 text-sm font-medium text-green-800 bg-green-100 rounded-xl dark:bg-green-900/30 dark:text-green-400">✓ {success}</div>}

          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 dark:border-slate-800 mb-8 pb-px">
            {[
              { id: 'share', label: '✏ Share a Concern' },
              { id: 'feed',  label: '🌐 Community Feed' },
              { id: 'mine',  label: '📌 Your Posts' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`px-6 py-3 font-semibold text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === t.id ? 'border-primary-500 text-primary-600 bg-primary-50/50 dark:bg-primary-900/20 rounded-tl-xl rounded-tr-xl' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-tl-xl rounded-tr-xl'}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'share' && (
            <div className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl p-6 lg:p-8 shadow-sm max-w-3xl mx-auto">
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">Share a Concern</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">Posts are reviewed by admin before appearing in the community feed.</p>
              
              <form onSubmit={handleCreatePost} className="space-y-6">
                <div>
                  <label htmlFor="postTitle" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Title</label>
                  <input
                    id="postTitle" type="text"
                    placeholder="Short summary of your concern"
                    value={newPost.title}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, title: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="postContent" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Details</label>
                  <textarea
                    id="postContent"
                    placeholder="Describe your question or concern in detail…"
                    rows={5}
                    value={newPost.content}
                    onChange={(e) => setNewPost((prev) => ({ ...prev, content: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all outline-none resize-y"
                  />
                </div>
                <div>
                  <label htmlFor="postImage" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Image (optional)</label>
                  <input id="postImage" type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:file:bg-primary-900/30 dark:file:text-primary-400 cursor-pointer" />
                  {newPost.imagePreview && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 inline-block">
                      <img src={newPost.imagePreview} alt="Preview" className="max-w-xs h-auto object-cover" />
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-right">
                  <button type="submit" className="btn-primary py-3 px-6 shadow-lg shadow-primary-500/30" disabled={submitting}>
                    {submitting ? 'Submitting…' : 'Submit for Approval →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'feed' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">Community Feed</h2>
              {loadingFeed ? (
                <div className="animate-pulse space-y-6">
                  {[1, 2].map(i => <div key={i} className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
                </div>
              ) : feedPosts.length === 0 ? (
                <div className="glass-card p-10 rounded-2xl text-center">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white">No Approved Posts Yet</h3>
                  <p className="text-slate-500 text-sm">Check back later or share a concern to start a discussion.</p>
                </div>
              ) : (
                feedPosts.map((post) => (
                  <div key={post._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4">
                      <div className="flex gap-3 items-center">
                        <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm">
                          {getInitials(post.author?.fullName)}
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-slate-900 dark:text-white leading-tight">{post.title}</h3>
                          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{post.author?.fullName || 'Unknown'} &bull; {formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      {isOwner(post) && (
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleEditPost(post)}>Edit</button>
                          <button type="button" className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors" onClick={() => handleDeletePost(post._id)}>Delete</button>
                        </div>
                      )}
                    </div>

                    <div className="p-6">
                      <p className="text-slate-700 dark:text-slate-300 text-sm mb-6 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>

                      {post.image && (
                        <div className="mb-6 rounded-xl overflow-hidden border border-slate-100 dark:border-white/5">
                          <img src={post.image} alt="Post attachment" className="w-full h-auto max-h-[500px] object-cover" />
                        </div>
                      )}

                      <div className="flex items-center gap-2 mb-4">
                        <button
                          type="button"
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 ${post.likedByCurrentUser ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                          onClick={() => handleToggleLike(post._id)}
                          disabled={actionLoading}
                        >
                          <span className={post.likedByCurrentUser ? "text-primary-500" : ""}>♥</span>
                          {post.likesCount || 0}
                        </button>
                        <button
                          type="button"
                          className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 flex items-center gap-2"
                          onClick={() => setActiveCommentPostId(activeCommentPostId === post._id ? null : post._id)}
                        >
                          <span>💬</span>
                          {post.comments?.length || 0} {post.comments?.length === 1 ? 'Reply' : 'Replies'}
                        </button>
                      </div>

                      {activeCommentPostId === post._id && (
                        <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                          {post.comments?.length === 0 ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">No replies yet. Be the first!</p>
                          ) : (
                            <div className="space-y-4">
                              {post.comments.map((comment) => (
                                <div key={comment._id} className="flex gap-4 p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50">
                                  <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                    {getInitials(comment.user?.fullName)}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-semibold text-sm text-slate-900 dark:text-white">{comment.user?.fullName || 'Anonymous'}</span>
                                      <span className="text-xs text-slate-500 dark:text-slate-400">&bull; {formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{comment.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-start gap-4 mt-4 pt-4">
                            <div className="flex-1">
                              <textarea
                                value={commentInputs[post._id] || ''}
                                onChange={(e) => handleCommentChange(post._id, e.target.value)}
                                placeholder="Write a reply…"
                                rows={2}
                                className="w-full px-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white transition-all outline-none resize-y"
                              />
                            </div>
                            <button
                              type="button"
                              className="btn-primary py-2 px-6 whitespace-nowrap text-sm h-[42px]"
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

          {activeTab === 'mine' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <h2 className="text-xl font-heading font-bold text-slate-900 dark:text-white mb-2">Your Posts</h2>
              {loadingMine ? (
                <div className="animate-pulse space-y-6">
                  {[1, 2].map(i => <div key={i} className="h-40 bg-slate-100 dark:bg-slate-800 rounded-2xl" />)}
                </div>
              ) : myPosts.length === 0 ? (
                <div className="glass-card p-10 rounded-2xl text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <h3 className="text-lg font-heading font-bold text-slate-900 dark:text-white">No Posts Found</h3>
                  <p className="text-slate-500 text-sm">You haven't submitted any posts yet.</p>
                </div>
              ) : (
                myPosts.map((post) => (
                  <div key={post._id} className="bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-heading font-bold text-slate-900 dark:text-white leading-tight">{post.title}</h3>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Submitted &bull; {formatDate(post.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg ${post.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400' : post.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400'}`}>
                          {post.status}
                        </span>
                        <div className="flex gap-2">
                          <button type="button" className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors" onClick={() => handleEditPost(post)}>Edit</button>
                          <button type="button" className="px-3 py-1 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors" onClick={() => handleDeletePost(post._id)}>Delete</button>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-slate-700 dark:text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>
                      {post.image && (
                        <div className="mt-4 rounded-xl overflow-hidden border border-slate-100 dark:border-white/5">
                          <img src={post.image} alt="Post attachment" className="w-full h-auto max-h-[300px] object-cover" />
                        </div>
                      )}
                      {post.status === 'rejected' && post.reviewReason && (
                        <div className="mt-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30">
                          <p className="text-xs uppercase font-bold text-red-800 dark:text-red-400 mb-1">Admin Feedback</p>
                          <p className="text-sm font-medium text-red-900 dark:text-red-300">{post.reviewReason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DashboardLayout>

      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
      <Toast {...toast} onClose={() => setToast({ ...toast, isVisible: false })} duration={4000} />
    </>
  );
}

export default StudentCommunity;