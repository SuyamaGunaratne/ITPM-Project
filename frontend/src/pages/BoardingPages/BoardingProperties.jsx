import { useEffect, useState } from 'react';
import useModal from '../../hooks/useModal';
import Modal from '../../components/Modal';
import DashboardLayout from '../../components/DashboardLayout';
import { boardingOwnerNavItems } from '../../utils/navConfig';
import { secureLogout, setupBackButtonProtection, checkAuthAndPreventCaching } from '../../utils/auth';

function BoardingProperties() {
  const { modal, closeModal, handleConfirm, showConfirm, showSuccess, showError } = useModal();

  const stored = window.localStorage.getItem('unihub_user');
  const storedUser = stored ? JSON.parse(stored) : null;
  const token = storedUser?.token;

  const [boardings, setBoardings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  
  const [form, setForm] = useState({
    businessName: '',
    ownerNIC: '',
    boardingAddress: '',
    city: '',
    district: '',
    monthlyRent: '',
    availableRooms: '',
    description: '',
    facilities: '',
  });

  // Load boardings on mount
  useEffect(() => {
    checkAuthAndPreventCaching();
    setupBackButtonProtection();

    const loadBoardings = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('http://localhost:5000/api/boardings', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setBoardings(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadBoardings();
  }, [token]);

  const resetForm = () => {
    setForm({
      businessName: '',
      ownerNIC: storedUser?.ownerNIC || '',
      boardingAddress: '',
      city: '',
      district: '',
      monthlyRent: '',
      availableRooms: '',
      description: '',
      facilities: '',
    });
    setSelectedImages([]);
    setImagePreviews([]);
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    
    // Validate files (PNG/JPG only, 5MB max)
    const validFiles = files.filter((file) => {
      if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
        showError('Invalid Format', `${file.name} is not a PNG or JPG image`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showError('File Too Large', `${file.name} exceeds 5MB`);
        return false;
      }
      return true;
    });

    setSelectedImages([...selectedImages, ...validFiles]);

    // Create previews for new images
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [
          ...prev,
          {
            id: Math.random(),
            src: event.target.result,
            filename: file.name,
            isNew: true,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (id, filename) => {
    // If it's a new image
    if (typeof id === 'number') {
      setImagePreviews((prev) => prev.filter((img) => img.id !== id));
      setSelectedImages((prev) =>
        prev.filter((file) => file.name !== filename)
      );
    } else {
      // If it's an existing image, mark for deletion
      setImagePreviews((prev) =>
        prev.map((img) =>
          img.filename === filename ? { ...img, deleted: true } : img
        )
      );
    }
  };

  const loadBoardingForEdit = (boarding) => {
    setForm({
      businessName: boarding.businessName,
      ownerNIC: boarding.ownerNIC,
      boardingAddress: boarding.boardingAddress,
      city: boarding.city,
      district: boarding.district,
      monthlyRent: boarding.monthlyRent.toString(),
      availableRooms: boarding.availableRooms.toString(),
      description: boarding.description,
      facilities: Array.isArray(boarding.facilities) ? boarding.facilities.join(', ') : boarding.facilities || '',
    });

    // Load existing images
    const existingImages = boarding.images.map((img) => ({
      id: img.filename,
      src: img.url || img.data,
      filename: img.filename,
      isNew: false,
    }));
    setImagePreviews(existingImages);
    setSelectedImages([]);
    setEditingId(boarding._id);
    setShowAddForm(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!token || saving) return;

    const isUpdate = !!editingId;
    const confirmMessage = isUpdate
      ? 'Update Boarding Property'
      : 'Add New Boarding';
    const confirmText = isUpdate
      ? 'Update your boarding property details and images'
      : 'Add a new boarding property with images for students to discover';

    showConfirm(confirmMessage, confirmText, async () => {
      try {
        setSaving(true);

        const formData = new FormData();
        formData.append('businessName', form.businessName);
        formData.append('ownerNIC', form.ownerNIC);
        formData.append('boardingAddress', form.boardingAddress);
        formData.append('city', form.city);
        formData.append('district', form.district);
        formData.append('monthlyRent', form.monthlyRent);
        formData.append('availableRooms', form.availableRooms);
        formData.append('description', form.description);
        formData.append('facilities', form.facilities);

        // Add new images
        selectedImages.forEach((file) => {
          formData.append('images', file);
        });

        // Mark deleted images
        const deletedImages = imagePreviews
          .filter((img) => img.deleted)
          .map((img) => img.filename);
        if (deletedImages.length > 0) {
          formData.append('imagesToDelete', JSON.stringify(deletedImages));
        }

        const url = editingId
          ? `http://localhost:5000/api/boardings/${editingId}`
          : 'http://localhost:5000/api/boardings';
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!res.ok) {
          showError('Error', 'Unable to save boarding. Please try again.');
          return;
        }

        const data = await res.json();

        // Update or add boarding to list
        setBoardings((prev) => {
          if (editingId) {
            return prev.map((b) => (b._id === editingId ? data : b));
          } else {
            return [data, ...prev];
          }
        });

        showSuccess(
          'Success',
          isUpdate
            ? 'Boarding updated successfully'
            : 'Boarding added successfully',
          () => {
            resetForm();
          }
        );
      } catch (err) {
        console.error(err);
        showError('Error', 'Unable to save boarding. Please try again.');
      } finally {
        setSaving(false);
      }
    });
  };

  const handleDeleteBoarding = (boardingId) => {
    showConfirm(
      'Delete Boarding',
      'Are you sure you want to delete this boarding? This action cannot be undone.',
      async () => {
        try {
          const res = await fetch(`http://localhost:5000/api/boardings/${boardingId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            showError('Error', 'Unable to delete boarding. Please try again.');
            return;
          }

          setBoardings((prev) => prev.filter((b) => b._id !== boardingId));
          showSuccess('Success', 'Boarding deleted successfully');
        } catch (err) {
          console.error(err);
          showError('Error', 'Unable to delete boarding. Please try again.');
        }
      }
    );
  };

  const handleLogout = () => {
    showConfirm('Logout Confirmation', 'Are you sure you want to logout?', () => secureLogout());
  };

  return (
    <>
      <DashboardLayout
        role="Boarding Owner"
        sidebarBrand="UniHub Boarding"
        sidebarSub="Boarding Properties"
        navItems={boardingOwnerNavItems}
        activePath="/boarding/properties"
        userName={storedUser?.name || storedUser?.fullName || 'Boarding Owner'}
        userAvatar={storedUser?.profileImage || '/images/teacher-avatar.jpg'}
        title="My Boarding Properties"
        subtitleText="Add or manage your boarding properties with images for students to discover."
        onLogout={handleLogout}
      >
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="glass-card p-8 text-center">Loading your boarding properties...</div>
          ) : (
            <>
              {/* Add/Edit Form */}
              {showAddForm && (
                <div className="mb-8 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-xl backdrop-blur-xl p-6 lg:p-10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-purple-500 to-pink-500"></div>
                  
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                        {editingId ? 'Edit Boarding Property' : 'Add New Boarding Property'}
                      </h2>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">
                        {editingId ? 'Update your boarding' : 'List'} details and upload images
                      </p>
                    </div>
                    <button
                      onClick={resetForm}
                      className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-2xl"
                    >
                      ✕
                    </button>
                  </div>

                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Business Name */}
                      <div className="space-y-2">
                        <label htmlFor="businessName" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                          Business Name *
                        </label>
                        <input
                          id="businessName"
                          required
                          value={form.businessName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-slate-900 dark:text-white shadow-sm"
                          placeholder="e.g., Sunrise Boarding"
                        />
                      </div>

                      {/* Owner NIC */}
                      <div className="space-y-2">
                        <label htmlFor="ownerNIC" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Owner NIC *
                        </label>
                        <input
                          id="ownerNIC"
                          required
                          value={form.ownerNIC}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-slate-900 dark:text-white shadow-sm"
                          placeholder="NIC number"
                        />
                      </div>

                      {/* Address */}
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="boardingAddress" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                          Address *
                        </label>
                        <input
                          id="boardingAddress"
                          required
                          value={form.boardingAddress}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all text-slate-900 dark:text-white shadow-sm"
                          placeholder="Street, city, suburb"
                        />
                      </div>

                      {/* City */}
                      <div className="space-y-2">
                        <label htmlFor="city" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          City *
                        </label>
                        <input
                          id="city"
                          required
                          value={form.city}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-slate-900 dark:text-white shadow-sm"
                          placeholder="e.g., Colombo"
                        />
                      </div>

                      {/* District */}
                      <div className="space-y-2">
                        <label htmlFor="district" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                          District *
                        </label>
                        <input
                          id="district"
                          required
                          value={form.district}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all text-slate-900 dark:text-white shadow-sm"
                          placeholder="e.g., Colombo"
                        />
                      </div>

                      {/* Monthly Rent */}
                      <div className="space-y-2">
                        <label htmlFor="monthlyRent" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                          Monthly Rent (LKR) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">Rs.</span>
                          <input
                            id="monthlyRent"
                            type="number"
                            required
                            value={form.monthlyRent}
                            onChange={handleChange}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all text-slate-900 dark:text-white shadow-sm"
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      {/* Available Rooms */}
                      <div className="space-y-2">
                        <label htmlFor="availableRooms" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                          Available Rooms *
                        </label>
                        <input
                          id="availableRooms"
                          type="number"
                          required
                          value={form.availableRooms}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-slate-900 dark:text-white shadow-sm"
                          placeholder="e.g., 5"
                        />
                      </div>

                      {/* Description */}
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="description" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                          Description *
                        </label>
                        <textarea
                          id="description"
                          required
                          value={form.description}
                          onChange={handleChange}
                          rows={4}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all text-slate-900 dark:text-white resize-none shadow-sm"
                          placeholder="Describe your boarding property, rules, atmosphere..."
                        />
                      </div>

                      {/* Facilities */}
                      <div className="space-y-2 md:col-span-2">
                        <label htmlFor="facilities" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                          Facilities
                        </label>
                        <input
                          id="facilities"
                          value={form.facilities}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all text-slate-900 dark:text-white shadow-sm"
                          placeholder="WiFi, Laundry, 24/7 water, Attached bathroom (comma-separated)"
                        />
                      </div>

                      {/* Image Upload */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-pink-500"></span>
                          Images (PNG/JPG, Max 5MB each)
                        </label>
                        <div className="bg-slate-50 dark:bg-slate-900/50 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept="image/png,image/jpeg,image/jpg"
                            onChange={handleImageSelect}
                            className="hidden"
                            id="imageInput"
                          />
                          <label htmlFor="imageInput" className="cursor-pointer block">
                            <svg className="w-12 h-12 mx-auto mb-2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-slate-700 dark:text-slate-300 font-medium">Click to upload images</p>
                            <p className="text-slate-500 dark:text-slate-400 text-sm">or drag and drop</p>
                          </label>
                        </div>
                      </div>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            Selected Images ({imagePreviews.length})
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {imagePreviews.map((img) => (
                              <div
                                key={img.id}
                                className={`relative rounded-lg overflow-hidden border-2 ${
                                  img.deleted ? 'border-red-500 opacity-50' : 'border-slate-200 dark:border-slate-700'
                                }`}
                              >
                                <img src={img.src} alt={img.filename} className="w-full h-32 object-cover" />
                                <button
                                  type="button"
                                  onClick={() => removeImage(img.id, img.filename)}
                                  className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                {img.deleted && (
                                  <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                    <span className="text-red-600 font-bold">DELETE</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 flex gap-3">
                      <button
                        type="submit"
                        className="flex-1 px-8 py-3.5 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>{editingId ? 'Update' : 'Add'} Boarding</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-8 py-3.5 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add New Button */}
              {!showAddForm && (
                <div className="mb-8">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium rounded-xl shadow-lg shadow-primary/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New Boarding
                  </button>
                </div>
              )}

              {/* Boardings List */}
              {boardings.length === 0 && !showAddForm ? (
                <div className="glass-card p-12 text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12a9 9 0 019-9 9.75 9.75 0 016.74 2.74L21 8M3 12a9 9 0 0018 0m0 0a9.75 9.75 0 01-6.74-2.74L3 16" />
                  </svg>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">No boarding properties yet</p>
                  <p className="text-slate-500 dark:text-slate-500 mt-2">Click the button above to add your first boarding</p>
                </div>
              ) : !showAddForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {boardings.map((boarding) => (
                    <div
                      key={boarding._id}
                      className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-3xl shadow-lg hover:shadow-xl transition-all overflow-hidden"
                    >
                      {/* Images Carousel */}
                      {boarding.images && boarding.images.length > 0 ? (
                        <div className="relative h-48 bg-slate-200 dark:bg-slate-700 overflow-hidden">
                          <img
                            src={boarding.images[0].url || boarding.images[0].data}
                            alt={boarding.businessName}
                            className="w-full h-full object-cover"
                          />
                          {boarding.images.length > 1 && (
                            <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded-lg text-xs font-medium">
                              {boarding.images.length} images
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

                      {/* Info */}
                      <div className="p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{boarding.businessName}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{boarding.boardingAddress}</p>

                        <div className="space-y-2 mb-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">City:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{boarding.city}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Monthly Rent:</span>
                            <span className="text-slate-900 dark:text-white font-medium">Rs. {boarding.monthlyRent.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">Available Rooms:</span>
                            <span className="text-slate-900 dark:text-white font-medium">{boarding.availableRooms}</span>
                          </div>
                        </div>

                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
                          {boarding.description}
                        </p>

                        {boarding.facilities && boarding.facilities.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Facilities:</p>
                            <div className="flex flex-wrap gap-1">
                              {boarding.facilities.slice(0, 3).map((facility, idx) => (
                                <span key={idx} className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-lg">
                                  {facility}
                                </span>
                              ))}
                              {boarding.facilities.length > 3 && (
                                <span className="text-slate-500 dark:text-slate-400 text-xs px-2 py-1">
                                  +{boarding.facilities.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                          <button
                            onClick={() => loadBoardingForEdit(boarding)}
                            className="flex-1 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBoarding(boarding._id)}
                            className="flex-1 px-4 py-2 bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
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

      <Modal {...modal} onClose={closeModal} onConfirm={handleConfirm} />
    </>
  );
}

export default BoardingProperties;