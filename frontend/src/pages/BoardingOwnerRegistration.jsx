import { useState, useRef } from 'react';
import AuthLayout from '../components/AuthLayout';

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
    'WiFi', 'Electricity', 'Water', 'Security',
    'Air Conditioning', 'Supplies', 'Laundry Service',
    'Food Facility', 'Parking'
  ];

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

  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalData({ ...personalData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result, 0.6);
          if (name === 'idFrontImage') {
            setPersonalData({ ...personalData, idFrontImage: compressed, idFrontPreview: compressed });
          } else if (name === 'idBackImage') {
            setPersonalData({ ...personalData, idBackImage: compressed, idBackPreview: compressed });
          }
        } catch (err) {
          setError('Error processing image. Please try again.');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAreaClick = (inputRef) => {
    if (inputRef.current) inputRef.current.click();
  };

  const handleBusinessChange = (e) => {
    const { name, value } = e.target;
    setBusinessData({ ...businessData, [name]: value });
  };

  const handleAmenityToggle = (amenity) => {
    const updated = businessData.amenities.includes(amenity)
      ? businessData.amenities.filter((a) => a !== amenity)
      : [...businessData.amenities, amenity];
    setBusinessData({ ...businessData, amenities: updated });
  };

  const validatePersonalDetails = () => {
    if (!personalData.firstName.trim() || !personalData.lastName.trim() || !personalData.email.trim() || !personalData.idNumber.trim() || !personalData.password.trim()) {
      setError('Please fill all required text fields.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalData.email)) {
      setError('Please enter a valid email.');
      return false;
    }
    if (personalData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (personalData.password !== personalData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (!personalData.idFrontImage || !personalData.idBackImage) {
      setError('Both front and back ID images are required.');
      return false;
    }
    return true;
  };

  const validateBusinessDetails = () => {
    if (!businessData.businessName.trim() || !businessData.address.trim() || !businessData.city.trim() || !businessData.district.trim()) {
      setError('Please fill all required business fields.');
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    setError('');
    if (validatePersonalDetails()) setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    if (!validateBusinessDetails()) return;

    try {
      setLoading(true);
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

      const response = await fetch('http://localhost:5000/api/registration/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Registration failed');

      setSuccessMessage(data.message);
      setRegistrationId(data.registrationId);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-dark-bg flex items-center justify-center p-4 font-sans">
        <div className="glass-panel max-w-md w-full p-8 text-center bg-white dark:bg-dark-card rounded-3xl shadow-2xl">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/50 text-green-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ✓
          </div>
          <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-4">Application Submitted!</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">{successMessage}</p>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl mb-8">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Registration ID</p>
            <p className="text-lg font-mono font-bold text-primary-600 dark:text-primary-400">{registrationId}</p>
          </div>
          <p className="text-sm text-slate-500 mb-8">We will review your application and notify you via email in 2-3 business days.</p>
          <a href="/" className="btn-primary block w-full py-3">Return to Home</a>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout 
      title="Partner with UniHub" 
      subtitle="Join our network of verified boarding owners and start reaching thousands of students looking for verified accommodations."
      contentMaxWidth="max-w-sm"
    >
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-slate-900 dark:text-white mb-1">Registration</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Complete the form below to submit your property.</p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-4 text-sm font-medium border border-red-200 dark:border-red-800/50 flex gap-3">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Steps Indicator */}
      <div className="flex items-center justify-center w-full mb-6">
        <div className={`flex flex-col items-center flex-1 ${step >= 1 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-colors ${step >= 1 ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>1</div>
          <span className="text-xs font-semibold uppercase tracking-wider hidden sm:block">Personal</span>
        </div>
        <div className={`w-12 h-1 mx-2 rounded-full ${step >= 2 ? 'bg-primary-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
        <div className={`flex flex-col items-center flex-1 ${step >= 2 ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-1 transition-colors ${step >= 2 ? 'bg-primary-100 dark:bg-primary-900/50' : 'bg-slate-100 dark:bg-slate-800'}`}>2</div>
          <span className="text-xs font-semibold uppercase tracking-wider hidden sm:block">Business</span>
        </div>
      </div>

      <div className="custom-scrollbar overflow-y-auto max-h-[45vh] pr-2 pb-2 -mr-2">
        {step === 1 && (
          <form className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">First Name *</label>
                <input type="text" name="firstName" value={personalData.firstName} onChange={handlePersonalChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="John" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Last Name *</label>
                <input type="text" name="lastName" value={personalData.lastName} onChange={handlePersonalChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="Doe" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address *</label>
              <input type="email" name="email" value={personalData.email} onChange={handlePersonalChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="john@example.com" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password *</label>
                <input type="password" name="password" value={personalData.password} onChange={handlePersonalChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="Min 6 chars" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm *</label>
                <input type="password" name="confirmPassword" value={personalData.confirmPassword} onChange={handlePersonalChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="Confirm" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">ID/NIC Number *</label>
              <input type="text" name="idNumber" value={personalData.idNumber} onChange={handlePersonalChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="123456789VX" />
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-dark-border pb-2 block">Identity Verification Documents *</label>
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors h-32 relative overflow-hidden group"
                  onClick={() => handleImageAreaClick(frontImageRef)}
                >
                  {personalData.idFrontPreview ? (
                    <img src={personalData.idFrontPreview} alt="Front ID" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <>
                      <span className="text-2xl mb-1 text-slate-400">📄</span>
                      <span className="text-xs text-slate-500 font-medium">Front Image</span>
                    </>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">Change</div>
                  <input ref={frontImageRef} type="file" accept="image/*" name="idFrontImage" onChange={handleImageUpload} className="hidden" />
                </div>
                <div 
                  className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors h-32 relative overflow-hidden group"
                  onClick={() => handleImageAreaClick(backImageRef)}
                >
                  {personalData.idBackPreview ? (
                    <img src={personalData.idBackPreview} alt="Back ID" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-50 transition-opacity" />
                  ) : (
                    <>
                      <span className="text-2xl mb-1 text-slate-400">📄</span>
                      <span className="text-xs text-slate-500 font-medium">Back Image</span>
                    </>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">Change</div>
                  <input ref={backImageRef} type="file" accept="image/*" name="idBackImage" onChange={handleImageUpload} className="hidden" />
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <button type="button" onClick={handleNextStep} className="w-full btn-primary py-3">
                Continue to Business Details
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Property/Business Name *</label>
              <input type="text" name="businessName" value={businessData.businessName} onChange={handleBusinessChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="Sunrise Boarding" />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Address *</label>
              <input type="text" name="address" value={businessData.address} onChange={handleBusinessChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="123 Main St" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">City *</label>
                <input type="text" name="city" value={businessData.city} onChange={handleBusinessChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="Colombo" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">District *</label>
                <input type="text" name="district" value={businessData.district} onChange={handleBusinessChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="Colombo" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Est. Monthly Rent (PKR)</label>
                <input type="number" name="monthlyRent" value={businessData.monthlyRent} onChange={handleBusinessChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="15000" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Capacity</label>
                <input type="number" name="totalCapacity" value={businessData.totalCapacity} onChange={handleBusinessChange} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 dark:bg-dark-bg dark:border-dark-border dark:text-white outline-none" placeholder="50" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-dark-border pb-2 block">Amenities Included</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {amenitiesList.map((amenity) => (
                  <label key={amenity} className="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" checked={businessData.amenities.includes(amenity)} onChange={() => handleAmenityToggle(amenity)} className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary w-1/3 py-3 text-sm">
                Back
              </button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 py-3 text-sm">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account? <a href="/login" className="font-medium text-primary-600 hover:text-primary-500">Log in</a>
      </p>
    </AuthLayout>
  );
}

export default BoardingOwnerRegistration;
