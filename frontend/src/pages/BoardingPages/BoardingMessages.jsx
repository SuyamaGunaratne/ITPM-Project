import { useEffect, useState } from 'react';
import useModal from '../../hooks/useModal';
import Modal from '../../components/Modal';
import DashboardLayout from '../../components/DashboardLayout';
import { boardingOwnerNavItems } from '../../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../../utils/auth';

function BoardingMessages() {
  const { modal, closeModal, handleConfirm, showConfirm, showSuccess, showError } = useModal();

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const loadMessages = async () => {
      try {
        const stored = window.localStorage.getItem('unihub_user');
        const user = stored ? JSON.parse(stored) : null;
        const token = user?.token;

        if (!token) {
          setLoading(false);
          return;
        }

        const res = await fetch('http://localhost:5000/api/boarding-messages/owner', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) {
          setMessages([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setMessages(data);
      } catch (err) {
        console.error(err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const ownerName = user?.fullName || user?.name || 'Boarding Owner';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => secureLogout()
    );
  };

  const openMessageDetails = (message) => {
    setSelectedMessage(message);
    setReplyMessage('');
  };

  const closeMessageDetails = () => {
    setSelectedMessage(null);
    setReplyMessage('');
  };

  const submitReply = async () => {
    if (!replyMessage.trim()) {
      return showError('Missing Reply', 'Please enter a reply message.');
    }

    const stored = window.localStorage.getItem('unihub_user');
    const user = stored ? JSON.parse(stored) : null;
    const token = user?.token;

    if (!token) {
      return showError('Not Authenticated', 'Please login to send a reply.');
    }

    setSubmittingReply(true);

    try {
      const res = await fetch(`http://localhost:5000/api/boarding-messages/${selectedMessage._id}/reply`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: replyMessage })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to send reply.');
      }

      // Update local state
      const updatedMessages = messages.map(msg =>
        msg._id === selectedMessage._id
          ? { ...msg, replies: [...msg.replies, {
              senderId: user._id,
              senderName: user.fullName || user.name,
              message: replyMessage,
              sentAt: new Date()
            }], lastActivity: new Date() }
          : msg
      );
      setMessages(updatedMessages);
      setSelectedMessage({ ...selectedMessage, replies: [...selectedMessage.replies, {
        senderId: user._id,
        senderName: user.fullName || user.name,
        message: replyMessage,
        sentAt: new Date()
      }] });

      showSuccess('Reply Sent', 'Your reply has been sent to the student.', () => setReplyMessage(''));
    } catch (err) {
      console.error('Failed to send reply:', err);
      showError('Send Failed', err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  const updateMessageStatus = async (messageId, status) => {
    try {
      const stored = window.localStorage.getItem('unihub_user');
      const user = stored ? JSON.parse(stored) : null;
      const token = user?.token;

      const res = await fetch(`http://localhost:5000/api/boarding-messages/${messageId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setMessages(messages.map(msg =>
        msg._id === messageId ? { ...msg, status } : msg
      ));

      showSuccess('Status Updated', `Message marked as ${status}.`);
    } catch (err) {
      showError('Update Failed', err.message);
    }
  };

  return (
    <>
      <DashboardLayout
        role="Boarding Owner"
        sidebarBrand="UniHub Boarding"
        sidebarSub="Messages"
        navItems={boardingOwnerNavItems}
        activePath="/boarding/messages"
        userName={ownerName}
        userAvatar={avatarSrc}
        title="Boarding Messages"
        subtitleText={`Manage inquiries about your boardings, ${ownerName}.`}
        onLogout={handleLogout}
      >
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="glass-card p-8 text-center rounded-2xl">
              <div className="inline-block">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-12 rounded-3xl shadow-lg text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Messages Yet</h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                You haven't received any inquiries about your boardings yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message._id}
                  className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                        {message.subject}
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        From: <span className="font-semibold">{message.studentName}</span> • 
                        Boarding: <span className="font-semibold">{message.boardingId.businessName}</span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {new Date(message.createdAt).toLocaleDateString()} • 
                        Status: <span className={`font-semibold ${
                          message.status === 'open' ? 'text-green-600' :
                          message.status === 'resolved' ? 'text-blue-600' : 'text-gray-600'
                        }`}>{message.status}</span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={message.status}
                        onChange={(e) => updateMessageStatus(message._id, e.target.value)}
                        className="px-3 py-1 text-xs border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                      >
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <button
                        onClick={() => openMessageDetails(message)}
                        className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors"
                      >
                        View & Reply
                      </button>
                    </div>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-2">
                    {message.initialMessage}
                  </p>
                  {message.replies.length > 0 && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                      {message.replies.length} reply{message.replies.length > 1 ? 'ies' : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>

      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeMessageDetails}>
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{selectedMessage.subject}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              From: <span className="font-semibold">{selectedMessage.studentName}</span> • 
              Boarding: <span className="font-semibold">{selectedMessage.boardingId.businessName}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Initial Message:</p>
                <p className="text-slate-900 dark:text-white">{selectedMessage.initialMessage}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {new Date(selectedMessage.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedMessage.replies.map((reply, index) => (
                <div key={index} className={`p-4 rounded-lg ${
                  reply.senderId === user?._id ? 'bg-primary/10 ml-8' : 'bg-slate-50 dark:bg-slate-800 mr-8'
                }`}>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    {reply.senderName} {reply.senderId === user?._id ? '(You)' : ''}:
                  </p>
                  <p className="text-slate-900 dark:text-white">{reply.message}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {new Date(reply.sentAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Reply:</label>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white mb-4"
                placeholder="Type your reply here..."
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeMessageDetails}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={submitReply}
                  disabled={submittingReply || !replyMessage.trim()}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {submittingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default BoardingMessages;