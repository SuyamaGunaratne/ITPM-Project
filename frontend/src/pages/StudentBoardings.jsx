import { useEffect, useState } from 'react';
import useModal from '../hooks/useModal';
import Modal from '../components/Modal';
import DashboardLayout from '../components/DashboardLayout';
import { studentNavItems } from '../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../utils/auth';

function StudentBoardings() {
  const { modal, closeModal, handleConfirm, showConfirm, showSuccess, showError } = useModal();

  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [minRent, setMinRent] = useState('');
  const [maxRent, setMaxRent] = useState('');
  const [filteredBoardings, setFilteredBoardings] = useState([]);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactBoarding, setContactBoarding] = useState(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [submittingContact, setSubmittingContact] = useState(false);

  const [showMessages, setShowMessages] = useState(false);
  const [myMessages, setMyMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const loadBoardings = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/boardings/public/all', {
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!res.ok) {
          setBoardings([]);
          setLoading(false);
          return;
        }

        const data = await res.json();
        setBoardings(data);
        setFilteredBoardings(data);
      } catch (err) {
        console.error(err);
        setBoardings([]);
        setFilteredBoardings([]);
      } finally {
        setLoading(false);
      }
    };

    loadBoardings();
  }, []);

  // Filter boardings based on search and filter criteria
  useEffect(() => {
    let results = boardings;

    if (searchQuery) {
      results = results.filter(
        (boarding) =>
          boarding.businessName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          boarding.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          boarding.boardingAddress?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterCity) {
      results = results.filter((boarding) =>
        boarding.city?.toLowerCase().includes(filterCity.toLowerCase())
      );
    }

    if (filterDistrict) {
      results = results.filter((boarding) =>
        boarding.district?.toLowerCase().includes(filterDistrict.toLowerCase())
      );
    }

    if (minRent) {
      results = results.filter((boarding) => boarding.monthlyRent >= Number(minRent));
    }

    if (maxRent) {
      results = results.filter((boarding) => boarding.monthlyRent <= Number(maxRent));
    }

    setFilteredBoardings(results);
  }, [searchQuery, filterCity, filterDistrict, minRent, maxRent, boardings]);

  const resetFilters = () => {
    setSearchQuery('');
    setFilterCity('');
    setFilterDistrict('');
    setMinRent('');
    setMaxRent('');
  };

  const stored = window.localStorage.getItem('unihub_user');
  const user = stored ? JSON.parse(stored) : null;
  const studentName = user?.fullName || user?.name || 'Student';
  const avatarSrc = user?.profileImage || '/images/teacher-avatar.jpg';

  const handleLogout = () => {
    showConfirm(
      'Logout Confirmation',
      'Are you sure you want to logout? You will be redirected to the login page.',
      () => secureLogout()
    );
  };

  const openContactOwnerModal = (boarding) => {
    setContactBoarding(boarding);
    setContactSubject(`Inquiry about ${boarding.businessName}`);
    setContactMessage(`Hi ${boarding.owner?.fullName || 'Boarding Owner'},\n\nI am interested in learning more about the boarding "${boarding.businessName}" (ID: ${boarding._id}). Please share additional details on availability, pricing, and amenities.\n\nThank you!`);
    setContactModalOpen(true);
  };

  const closeContactOwnerModal = () => {
    setContactModalOpen(false);
    setContactBoarding(null);
    setContactSubject('');
    setContactMessage('');
    setSubmittingContact(false);
  };

  const submitContactOwner = async () => {
    if (!contactBoarding || !contactSubject.trim() || !contactMessage.trim()) {
      return showError('Missing Information', 'Subject and message are required to contact the owner.');
    }

    const stored = window.localStorage.getItem('unihub_user');
    const user = stored ? JSON.parse(stored) : null;
    const token = user?.token;

    if (!token) {
      return showError('Not Authenticated', 'Please login to send a message.');
    }

    setSubmittingContact(true);

    try {
      const payload = {
        boardingId: contactBoarding._id,
        subject: contactSubject,
        message: contactMessage
      };

      const res = await fetch('http://localhost:5000/api/boarding-messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to send message to owner.');
      }

      showSuccess('Message Sent', 'Your message has been sent directly to the boarding owner. Check the "View My Messages" section to see their response.', closeContactOwnerModal);
    } catch (err) {
      console.error('Failed to send contact request:', err);
      showError('Send Failed', err.message);    
      setSubmittingContact(false);
    }
  };

  const toggleMessages = async () => {
    if (!showMessages) {
      // Load messages when opening
      await loadMyMessages();
    }
    setShowMessages(!showMessages);
  };

  const loadMyMessages = async () => {
    setLoadingMessages(true);
    try {
      const stored = window.localStorage.getItem('unihub_user');
      const user = stored ? JSON.parse(stored) : null;
      const token = user?.token;

      if (!token) {
        setMyMessages([]);
        return;
      }

      const res = await fetch('http://localhost:5000/api/boarding-messages/student', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        setMyMessages([]);
        return;
      }

      const data = await res.json();
      setMyMessages(data);
    } catch (err) {
      console.error('Failed to load messages:', err);
      setMyMessages([]);
    } finally {
      setLoadingMessages(false);
    }
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
      const updatedMessages = myMessages.map(msg =>
        msg._id === selectedMessage._id
          ? { ...msg, replies: [...msg.replies, {
              senderId: user._id,
              senderName: user.fullName || user.name,
              message: replyMessage,
              sentAt: new Date()
            }], lastActivity: new Date() }
          : msg
      );
      setMyMessages(updatedMessages);
      setSelectedMessage({ ...selectedMessage, replies: [...selectedMessage.replies, {
        senderId: user._id,
        senderName: user.fullName || user.name,
        message: replyMessage,
        sentAt: new Date()
      }] });

      showSuccess('Reply Sent', 'Your reply has been sent to the boarding owner.', () => setReplyMessage(''));
    } catch (err) {
      console.error('Failed to send reply:', err);
      showError('Send Failed', err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <>
      <DashboardLayout
        role="Student"
        sidebarBrand="UniHub Student"
        sidebarSub="Boardings"
        navItems={studentNavItems}
        activePath="/student/boardings"
        userName={studentName}
        userAvatar={avatarSrc}
        title="Available Boardings"
        subtitleText={`Browse and discover boarding places for ${studentName}.`}
        onLogout={handleLogout}
      >
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="glass-card p-8 text-center rounded-2xl">
              <div className="inline-block">
                <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading available boardings...</p>
            </div>
          ) : (
            <>
              {/* Search and Filter Section */}
              <div className="mb-8 space-y-4">
                {/* Main Search Bar */}
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-6 h-6 text-slate-400 group-focus-within:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search for your ideal boarding by name, description, or address..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all"
                  />
                </div>

                {/* Filters Row */}
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm p-4 flex flex-col lg:flex-row gap-4 items-center">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    {/* City */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="City (e.g. Colombo)"
                        value={filterCity}
                        onChange={(e) => setFilterCity(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 text-sm text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                    {/* District */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        placeholder="District"
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 text-sm text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                    {/* Min Rent */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-medium text-sm">LKR</span>
                      </div>
                      <input
                        type="number"
                        placeholder="Min Rent"
                        value={minRent}
                        onChange={(e) => setMinRent(e.target.value)}
                        className="w-full pl-11 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 text-sm text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                    {/* Max Rent */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-medium text-sm">LKR</span>
                      </div>
                      <input
                        type="number"
                        placeholder="Max Rent"
                        value={maxRent}
                        onChange={(e) => setMaxRent(e.target.value)}
                        className="w-full pl-11 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 text-sm text-slate-900 dark:text-white transition-all shadow-sm"
                      />
                    </div>
                  </div>
                  
                  {/* Reset Button */}
                  <div className="w-full lg:w-auto flex-shrink-0">
                    <button
                      onClick={resetFilters}
                      className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors shadow-sm"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Counter */}
              {boardings.length > 0 && (
                <div className="mb-4 text-slate-600 dark:text-slate-400">
                  Showing <span className="font-bold text-slate-900 dark:text-white">{filteredBoardings.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{boardings.length}</span> boardings
                </div>
              )}

              {/* Messages Toggle */}
              <div className="mb-6 flex justify-center">
                <button
                  onClick={toggleMessages}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-medium rounded-xl hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {showMessages ? 'Hide Messages' : 'View My Messages'}
                  {myMessages.length > 0 && !showMessages && (
                    <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                      {myMessages.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Messages Section */}
              {showMessages && (
                <div className="mb-8 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">My Boarding Messages</h3>
                  
                  {loadingMessages ? (
                    <div className="text-center py-8">
                      <div className="inline-block">
                        <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                      <p className="mt-2 text-slate-600 dark:text-slate-400">Loading messages...</p>
                    </div>
                  ) : myMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 mx-auto mb-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Messages Yet</h4>
                      <p className="text-slate-600 dark:text-slate-400">You haven't contacted any boarding owners yet. Use the "Contact Owner" button on boarding cards to start conversations.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myMessages.map((message) => (
                        <div
                          key={message._id}
                          className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-slate-900 dark:text-white">{message.subject}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                To: {message.ownerId.fullName} • {message.boardingId.businessName}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                message.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400' :
                                message.status === 'resolved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
                              }`}>
                                {message.status}
                              </span>
                              <button
                                onClick={() => openMessageDetails(message)}
                                className="text-sm text-primary hover:text-primary/80 font-medium"
                              >
                                View Conversation
                              </button>
                            </div>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-sm line-clamp-2">{message.initialMessage}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                            {new Date(message.createdAt).toLocaleDateString()} • 
                            {message.replies.length} repl{message.replies.length !== 1 ? 'ies' : 'y'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Boardings Grid */}
              {filteredBoardings.length === 0 ? (
                <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 p-12 rounded-3xl shadow-lg text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21l-7-5m0 0l-7 5m7-5v-2a4 4 0 00-4-4H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3a4 4 0 00-4 4v2z" />
                  </svg>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Boardings Found</h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {boardings.length === 0
                      ? "There are no approved boarding places listed yet. Please check back later."
                      : "Try adjusting your search or filter criteria to find more boardings."}
                  </p>
                  {boardings.length > 0 && (
                    <button
                      onClick={resetFilters}
                      className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition-colors inline-block"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBoardings.map((boarding) => (
                    <div
                      key={boarding._id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                    >
                      {/* Image */}
                      {boarding.images && boarding.images.length > 0 && boarding.images[0].url ? (
                        <div className="relative h-48 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <img
                            src={boarding.images[0].url}
                            alt={boarding.businessName}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                          {boarding.images.length > 1 && (
                            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-xs font-medium">
                              +{boarding.images.length - 1} more
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center">
                          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                          {boarding.businessName || 'Untitled Boarding'}
                        </h3>
                        
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-3 flex items-start gap-2">
                          <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                          </svg>
                          <span>{boarding.boardingAddress || 'Address not provided'}</span>
                        </p>

                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">City:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{boarding.city || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">District:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{boarding.district || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Monthly Rent:</span>
                            <span className="font-semibold text-primary">LKR {boarding.monthlyRent?.toLocaleString() || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">Available Rooms:</span>
                            <span className="font-semibold text-slate-900 dark:text-white">{boarding.availableRooms || 'N/A'}</span>
                          </div>
                        </div>

                        {boarding.description && (
                          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-3">
                            {boarding.description}
                          </p>
                        )}

                        {boarding.facilities && boarding.facilities.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Facilities:</p>
                            <div className="flex flex-wrap gap-2">
                              {boarding.facilities.slice(0, 3).map((facility, idx) => (
                                <span
                                  key={idx}
                                  className="inline-block bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-xs px-3 py-1 rounded-full font-medium"
                                >
                                  {facility}
                                </span>
                              ))}
                              {boarding.facilities.length > 3 && (
                                <span className="inline-block text-slate-500 dark:text-slate-400 text-xs px-3 py-1">
                                  +{boarding.facilities.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        <div className="pt-4 mt-auto border-t border-slate-200 dark:border-slate-700 flex flex-col justify-end">
                          {boarding.owner && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                              Contact: <span className="font-semibold text-slate-700 dark:text-slate-300">{boarding.owner.fullName}</span>
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={() => openContactOwnerModal(boarding)}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
                          >
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Contact Owner
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </DashboardLayout>

      {contactModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeContactOwnerModal}>
          <div
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6" 
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Contact Boarding Owner</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Send a direct message to the boarding owner. They will receive your inquiry and can respond directly.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  value={contactSubject}
                  onChange={(e) => setContactSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Message</label>
                <textarea
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeContactOwnerModal}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitContactOwner}
                disabled={submittingContact}
                className="px-4 py-2.5 rounded-lg font-semibold bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white transition-all shadow-sm disabled:opacity-60"
              >
                {submittingContact ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={closeMessageDetails}>
          <div
            className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{selectedMessage.subject}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              To: <span className="font-semibold">{selectedMessage.ownerId.fullName}</span> • 
              Boarding: <span className="font-semibold">{selectedMessage.boardingId.businessName}</span>
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Your Message:</p>
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

export default StudentBoardings;
