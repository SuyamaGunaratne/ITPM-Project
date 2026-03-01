import { useState, useRef } from 'react';
import '../styles/RegistrationForm.css';

function BoardingOwnerRegistration() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [registrationId, setRegistrationId] = useState('');

  // File input refs
  const frontImageRef = useRef(null);
  const backImageRef = useRef(null);

  // Personal Details
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    idNumber: '',
    password: '',
    confirmPassword: '',
    idFrontImage: null,
    idBackImage: null,
    idFrontPreview: null,
    idBackPreview: null
  });

  // Business Details
  const [businessData, setBusinessData] = useState({
    businessName: '',
    address: '',
    city: '',
    district: '',
    monthlyRent: '',
    totalCapacity: '',
    availableRooms: '',
    amenities: []
  });

  const amenitiesList = [
    'WiFi',
    'Electricity',
    'Water',
    'Security',
    'Air Conditioning',
    'Supplies',
    'Laundry Service',
    'Food Facility',
    'Parking'
  ];

  // Compress image to reduce size
  const compressImage = (base64String, quality = 0.7) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width * 0.8;
        canvas.height = img.height * 0.8;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', quality);
        resolve(compressed);
      };
    });
  };

  // Handle personal details input
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalData({
      ...personalData,
      [name]: value
    });
  };

  // Handle image upload with compression
  const handleImageUpload = async (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          // Compress the image
          const compressed = await compressImage(reader.result, 0.6);
          
          if (name === 'idFrontImage') {
            setPersonalData({
              ...personalData,
              idFrontImage: compressed,
              idFrontPreview: compressed
            });
          } else if (name === 'idBackImage') {
            setPersonalData({
              ...personalData,
              idBackImage: compressed,
              idBackPreview: compressed
            });
          }
        } catch (err) {
          setError('Error processing image. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle click on image upload area
  const handleImageAreaClick = (inputRef) => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  // Handle business details input
  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessData({
      ...businessData,
      [name]: value
    });
  };

  // Handle amenities selection
  const handleAmenityToggle = (amenity) => {
    const updated = businessData.amenities.includes(amenity)
      ? businessData.amenities.filter((a) => a !== amenity)
      : [...businessData.amenities, amenity];
    setBusinessData({
      ...businessData,
      amenities: updated
    });
  };

  // Validate personal details
  const validatePersonalDetails = () => {
    if (!personalData.firstName.trim()) {
      setError('First name is required');
      return false;
    }
    if (!personalData.lastName.trim()) {
      setError('Last name is required');
      return false;
    }
    if (!personalData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      setError('Please enter a valid email');
      return false;
    }
    if (!personalData.idNumber.trim()) {
      setError('ID number is required');
      return false;
    }
    if (!personalData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (personalData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (personalData.password !== personalData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!personalData.idFrontImage) {
      setError('ID front image is required');
      return false;
    }
    if (!personalData.idBackImage) {
      setError('ID back image is required');
      return false;
    }
    return true;
  };

  // Validate business details
  const validateBusinessDetails = () => {
    if (!businessData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }
    if (!businessData.address.trim()) {
      setError('Address is required');
      return false;
    }
    if (!businessData.city.trim()) {
      setError('City is required');
      return false;
    }
    if (!businessData.district.trim()) {
      setError('District is required');
      return false;
    }
    return true;
  };

  // Go to step 2
  const handleNextStep = () => {
    setError('');
    if (validatePersonalDetails()) {
      setStep(2);
    }
  };

  // Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!validateBusinessDetails()) {
      return;
    }

    try {
      setLoading(true);

      // Create clean registration data without preview fields and confirmPassword
      const registrationData = {
        firstName: personalData.firstName,
        lastName: personalData.lastName,
        email: personalData.email,
        idNumber: personalData.idNumber,
        password: personalData.password,
        idFrontImage: personalData.idFrontImage,
        idBackImage: personalData.idBackImage,
        businessName: businessData.businessName,
        address: businessData.address,
        city: businessData.city,
        district: businessData.district,
        monthlyRent: businessData.monthlyRent,
        totalCapacity: businessData.totalCapacity,
        availableRooms: businessData.availableRooms,
        amenities: businessData.amenities
      };

      // Log the data being sent (for debugging)
      console.log('Sending registration data with fields:', Object.keys(registrationData));
      console.log('Image size (front):', registrationData.idFrontImage?.length || 0, 'bytes');
      console.log('Image size (back):', registrationData.idBackImage?.length || 0, 'bytes');
      console.log('Total payload size:', JSON.stringify(registrationData).length, 'bytes');

      const response = await fetch('http://localhost:5000/api/registration/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationData)
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccessMessage(data.message);
      setRegistrationId(data.registrationId);

      // Popup will handle navigation, no need for timeout
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-container">
      {/* Success Popup Modal */}
      {successMessage && (
        <div className="success-overlay">
          <div className="success-popup">
            <div className="success-icon">✓</div>
            <h2>Application Submitted Successfully!</h2>
            <p className="success-message">{successMessage}</p>
            <div className="success-details">
              <div className="detail-row">
                <label>Registration ID:</label>
                <span className="registration-id">{registrationId}</span>
              </div>
              <p className="success-note">
                We will review your application and notify you via email. This usually takes 2-3 business days.
              </p>
            </div>
            <button
              className="btn-close-popup"
              onClick={() => {
                setSuccessMessage('');
                setRegistrationId('');
                window.location.href = '/';
              }}
            >
              Return to Home
            </button>
          </div>
        </div>
      )}

      <div className="registration-card">
        <div className="registration-card-header">
          <h1>Boarding Owner Registration</h1>
          <button
            className="btn-back-home"
            onClick={() => (window.location.href = '/')}
            title="Back to Home"
          >
            ← Home
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="error-message">{error}</div>}

        {/* Step Indicator */}
        <div className="step-indicator">
          <div className={`step ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>
            <span>1</span>
            <p>Personal Details</p>
          </div>
          <div className="step-line" />
          <div className={`step ${step === 2 ? 'active' : ''}`}>
            <span>2</span>
            <p>Business Details</p>
          </div>
        </div>

        {/* Step 1: Personal Details */}
        {step === 1 && (
          <form className="registration-form">
            <h2>Step 1: Personal Details</h2>

            <div className="form-row">
              <div className="form-group">
                <label>First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={personalData.firstName}
                  onChange={handlePersonalChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={personalData.lastName}
                  onChange={handlePersonalChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={personalData.email}
                onChange={handlePersonalChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={personalData.password}
                  onChange={handlePersonalChange}
                  placeholder="Enter a password (min 6 characters)"
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={personalData.confirmPassword}
                  onChange={handlePersonalChange}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>ID Number (CNIC/Passport) *</label>
              <input
                type="text"
                name="idNumber"
                value={personalData.idNumber}
                onChange={handlePersonalChange}
                placeholder="Enter your ID number"
                required
              />
            </div>

            <div className="image-section">
              <h3>Upload ID Documents</h3>

              <div className="form-row">
                <div className="form-group image-upload">
                  <label>ID Front Image *</label>
                  <div
                    className="image-upload-area"
                    onClick={() => handleImageAreaClick(frontImageRef)}
                  >
                    {personalData.idFrontPreview && (
                      <img src={personalData.idFrontPreview} alt="ID Front Preview" />
                    )}
                    <input
                      ref={frontImageRef}
                      type="file"
                      accept="image/*"
                      name="idFrontImage"
                      onChange={handleImageUpload}
                      required
                    />
                    <p>{personalData.idFrontImage ? '✓ Image uploaded' : 'Click to upload front image'}</p>
                  </div>
                </div>

                <div className="form-group image-upload">
                  <label>ID Back Image *</label>
                  <div
                    className="image-upload-area"
                    onClick={() => handleImageAreaClick(backImageRef)}
                  >
                    {personalData.idBackPreview && (
                      <img src={personalData.idBackPreview} alt="ID Back Preview" />
                    )}
                    <input
                      ref={backImageRef}
                      type="file"
                      accept="image/*"
                      name="idBackImage"
                      onChange={handleImageUpload}
                      required
                    />
                    <p>{personalData.idBackImage ? '✓ Image uploaded' : 'Click to upload back image'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-next"
                onClick={handleNextStep}
              >
                Next: Business Details →
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Business Details */}
        {step === 2 && (
          <form className="registration-form" onSubmit={handleSubmit}>
            <h2>Step 2: Business Details</h2>

            <div className="form-group">
              <label>Business/Property Name *</label>
              <input
                type="text"
                name="businessName"
                value={businessData.businessName}
                onChange={handleBusinessChange}
                placeholder="Enter business name"
                required
              />
            </div>

            <div className="form-group">
              <label>Address *</label>
              <input
                type="text"
                name="address"
                value={businessData.address}
                onChange={handleBusinessChange}
                placeholder="Enter full address"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  name="city"
                  value={businessData.city}
                  onChange={handleBusinessChange}
                  placeholder="Enter city"
                  required
                />
              </div>
              <div className="form-group">
                <label>District *</label>
                <input
                  type="text"
                  name="district"
                  value={businessData.district}
                  onChange={handleBusinessChange}
                  placeholder="Enter district"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Monthly Rent (PKR)</label>
                <input
                  type="number"
                  name="monthlyRent"
                  value={businessData.monthlyRent}
                  onChange={handleBusinessChange}
                  placeholder="e.g., 8000"
                />
              </div>
              <div className="form-group">
                <label>Total Capacity</label>
                <input
                  type="number"
                  name="totalCapacity"
                  value={businessData.totalCapacity}
                  onChange={handleBusinessChange}
                  placeholder="e.g., 50"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Available Rooms</label>
              <input
                type="number"
                name="availableRooms"
                value={businessData.availableRooms}
                onChange={handleBusinessChange}
                placeholder="e.g., 10"
              />
            </div>

            <div className="form-group">
              <label>Available Amenities</label>
              <div className="checkbox-group">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={businessData.amenities.includes(amenity)}
                      onChange={() => handleAmenityToggle(amenity)}
                    />
                    <span>{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-back"
                onClick={() => setStep(1)}
              >
                ← Back
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default BoardingOwnerRegistration;
