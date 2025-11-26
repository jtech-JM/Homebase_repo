"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Upload, 
  Mail, 
  Phone, 
  MapPin, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  Camera,
  FileText,
  Shield,
  Star
} from 'lucide-react';

export default function StudentVerificationFlow({ onComplete, isOptional = false }) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationData, setVerificationData] = useState({
    university: '',
    studentId: '',
    graduationYear: '',
    major: '',
    universityEmail: '',
    phoneNumber: '',
    documents: [],
    socialMedia: {
      linkedin: '',
      facebook: ''
    },
    location: null
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [verificationScore, setVerificationScore] = useState(0);

  const verificationSteps = [
    {
      id: 'basic_info',
      title: 'Basic Information',
      description: 'Provide your university and student details',
      required: true,
      icon: FileText,
      component: BasicInfoStep
    },
    {
      id: 'document_upload',
      title: 'Student ID Upload',
      description: 'Upload your student ID card or document',
      required: true,
      icon: Upload,
      component: DocumentUploadStep
    },
    {
      id: 'email_verification',
      title: 'University Email',
      description: 'Verify your university email address',
      required: true,
      icon: Mail,
      component: EmailVerificationStep
    },
    {
      id: 'phone_verification',
      title: 'Phone Verification',
      description: 'Verify your phone number via SMS',
      required: !isOptional,
      icon: Phone,
      component: PhoneVerificationStep
    },
    {
      id: 'social_media',
      title: 'Social Media (Optional)',
      description: 'Link your LinkedIn or Facebook profile',
      required: false,
      icon: Users,
      component: SocialMediaStep
    },
    {
      id: 'location',
      title: 'Location (Optional)',
      description: 'Verify your proximity to campus',
      required: false,
      icon: MapPin,
      component: LocationStep
    }
  ];

  const handleStepComplete = (stepId, stepData) => {
    setVerificationData(prev => ({ ...prev, ...stepData }));
    setCompletedSteps(prev => new Set([...prev, stepId]));
    
    // Calculate verification score
    const newScore = calculateVerificationScore(stepId);
    setVerificationScore(newScore);
    
    // Move to next required step or complete
    const nextStep = findNextRequiredStep();
    if (nextStep !== -1) {
      setCurrentStep(nextStep);
    } else {
      handleVerificationComplete();
    }
  };

  const calculateVerificationScore = (completedStepId) => {
    const stepScores = {
      'basic_info': 20,
      'document_upload': 30,
      'email_verification': 25,
      'phone_verification': 15,
      'social_media': 5,
      'location': 5
    };

    let score = 0;
    completedSteps.forEach(stepId => {
      score += stepScores[stepId] || 0;
    });
    
    // Add current step score
    score += stepScores[completedStepId] || 0;
    
    return Math.min(score, 100);
  };

  const findNextRequiredStep = () => {
    for (let i = currentStep + 1; i < verificationSteps.length; i++) {
      const step = verificationSteps[i];
      if (step.required && !completedSteps.has(step.id)) {
        return i;
      }
    }
    return -1;
  };

  const handleVerificationComplete = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/verification/submit/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      if (response.ok) {
        onComplete && onComplete(verificationData, verificationScore);
      } else {
        setErrors({ general: 'Failed to submit verification. Please try again.' });
      }
    } catch (error) {
      setErrors({ general: 'An error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const skipOptionalStep = () => {
    const nextStep = findNextRequiredStep();
    if (nextStep !== -1) {
      setCurrentStep(nextStep);
    } else {
      handleVerificationComplete();
    }
  };

  const currentStepData = verificationSteps[currentStep];
  const CurrentStepComponent = currentStepData?.component;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Student Verification</h2>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              Score: {verificationScore}/100
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(completedSteps.size / verificationSteps.length) * 100}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between">
          {verificationSteps.map((step, index) => {
            const isCompleted = completedSteps.has(step.id);
            const isCurrent = index === currentStep;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-2
                  ${isCompleted ? 'bg-green-500 text-white' : 
                    isCurrent ? 'bg-blue-500 text-white' : 
                    'bg-gray-200 text-gray-500'}
                `}>
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs text-center ${
                  isCompleted ? 'text-green-600' : 
                  isCurrent ? 'text-blue-600' : 
                  'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {!step.required && (
                  <span className="text-xs text-gray-400">(Optional)</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {currentStepData && (
          <>
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {currentStepData.title}
              </h3>
              <p className="text-gray-600">{currentStepData.description}</p>
              {!currentStepData.required && (
                <div className="mt-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-yellow-600">This step is optional</span>
                </div>
              )}
            </div>

            {CurrentStepComponent && (
              <CurrentStepComponent
                data={verificationData}
                onComplete={(stepData) => handleStepComplete(currentStepData.id, stepData)}
                onError={setErrors}
                loading={loading}
                setLoading={setLoading}
              />
            )}

            {/* Skip Option for Optional Steps */}
            {!currentStepData.required && (
              <div className="mt-6 text-center">
                <button
                  onClick={skipOptionalStep}
                  className="text-gray-500 hover:text-gray-700 text-sm underline"
                >
                  Skip this step
                </button>
              </div>
            )}
          </>
        )}

        {/* Error Display */}
        {errors.general && (
          <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{errors.general}</p>
            </div>
          </div>
        )}
      </div>

      {/* Verification Benefits */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">Why verify your student status?</h4>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Access to student-only housing listings
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Priority booking for popular properties
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Student discounts and special offers
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            Enhanced trust and safety features
          </li>
        </ul>
      </div>
    </div>
  );
}

// Individual Step Components
function BasicInfoStep({ data, onComplete, onError, loading, setLoading }) {
  const [formData, setFormData] = useState({
    university: data.university || '',
    studentId: data.studentId || '',
    graduationYear: data.graduationYear || '',
    major: data.major || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.university || !formData.studentId) {
      onError({ basic_info: 'University and Student ID are required' });
      return;
    }

    onComplete(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          University *
        </label>
        <input
          type="text"
          value={formData.university}
          onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., Harvard University"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Student ID *
        </label>
        <input
          type="text"
          value={formData.studentId}
          onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="e.g., 12345678"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expected Graduation Year
          </label>
          <input
            type="number"
            value={formData.graduationYear}
            onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="2025"
            min="2024"
            max="2030"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Major/Field of Study
          </label>
          <input
            type="text"
            value={formData.major}
            onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Computer Science"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        Continue
      </button>
    </form>
  );
}

function DocumentUploadStep({ data, onComplete, onError, loading, setLoading }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        onError({ document: 'File size must be less than 5MB' });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      onError({ document: 'Please select a file to upload' });
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('document', selectedFile);
      formData.append('document_type', 'student_id');

      // Mock upload - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onComplete({ 
        documents: [...(data.documents || []), {
          type: 'student_id',
          file: selectedFile,
          uploaded_at: new Date().toISOString()
        }]
      });
    } catch (error) {
      onError({ document: 'Upload failed. Please try again.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="document-upload"
        />
        <label htmlFor="document-upload" className="cursor-pointer">
          <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Upload your Student ID
          </p>
          <p className="text-sm text-gray-500">
            Click to select or drag and drop your student ID card
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Supported formats: JPG, PNG, PDF (max 5MB)
          </p>
        </label>
      </div>

      {preview && (
        <div className="mt-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
          <img 
            src={preview} 
            alt="Document preview" 
            className="max-w-full h-48 object-contain border rounded-lg"
          />
        </div>
      )}

      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Analyzing document...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload & Verify
            </>
          )}
        </button>
      )}

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="flex">
          <AlertCircle className="w-5 h-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-yellow-700">
              <strong>Tips for best results:</strong>
            </p>
            <ul className="text-sm text-yellow-600 mt-1 space-y-1">
              <li>• Ensure the document is clearly visible and well-lit</li>
              <li>• Include the full student ID card in the image</li>
              <li>• Make sure text is readable and not blurry</li>
              <li>• Avoid shadows or glare on the document</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailVerificationStep({ data, onComplete, onError, loading, setLoading }) {
  const [email, setEmail] = useState(data.universityEmail || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const isValidUniversityEmail = (email) => {
    return email.endsWith('.edu') || 
           email.includes('university') || 
           email.includes('college');
  };

  const sendVerificationCode = async () => {
    if (!email || !isValidUniversityEmail(email)) {
      onError({ email: 'Please enter a valid university email address' });
      return;
    }

    setLoading(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCodeSent(true);
      onError({}); // Clear errors
    } catch (error) {
      onError({ email: 'Failed to send verification code' });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      onError({ code: 'Please enter the 6-digit verification code' });
      return;
    }

    setVerifying(true);
    try {
      // Mock verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete({ 
        universityEmail: email,
        emailVerified: true 
      });
    } catch (error) {
      onError({ code: 'Invalid verification code' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          University Email Address *
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your.name@university.edu"
          disabled={codeSent}
        />
        <p className="text-xs text-gray-500 mt-1">
          Must be your official university email address
        </p>
      </div>

      {!codeSent ? (
        <button
          onClick={sendVerificationCode}
          disabled={loading || !email}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Verification Code'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-sm text-green-700">
              Verification code sent to {email}. Please check your inbox.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Verification Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg tracking-widest"
              placeholder="000000"
              maxLength={6}
            />
          </div>

          <button
            onClick={verifyCode}
            disabled={verifying || verificationCode.length !== 6}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {verifying ? 'Verifying...' : 'Verify Email'}
          </button>

          <button
            onClick={() => setCodeSent(false)}
            className="w-full text-gray-500 hover:text-gray-700 text-sm underline"
          >
            Use different email address
          </button>
        </div>
      )}
    </div>
  );
}

function PhoneVerificationStep({ data, onComplete, onError, loading, setLoading }) {
  const [phone, setPhone] = useState(data.phoneNumber || '');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  const sendSMSCode = async () => {
    if (!phone) {
      onError({ phone: 'Please enter your phone number' });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setCodeSent(true);
    } catch (error) {
      onError({ phone: 'Failed to send SMS code' });
    } finally {
      setLoading(false);
    }
  };

  const verifyPhone = async () => {
    if (!verificationCode) {
      onError({ phone_code: 'Please enter the verification code' });
      return;
    }

    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onComplete({ 
        phoneNumber: phone,
        phoneVerified: true 
      });
    } catch (error) {
      onError({ phone_code: 'Invalid verification code' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+1 (555) 123-4567"
          disabled={codeSent}
        />
      </div>

      {!codeSent ? (
        <button
          onClick={sendSMSCode}
          disabled={loading || !phone}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Send SMS Code
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-sm text-blue-700">
              SMS code sent to {phone}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SMS Code
            </label>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter SMS code"
            />
          </div>

          <button
            onClick={verifyPhone}
            disabled={loading || !verificationCode}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            Verify Phone
          </button>
        </div>
      )}
    </div>
  );
}

function SocialMediaStep({ data, onComplete, onError }) {
  const [socialData, setSocialData] = useState({
    linkedin: data.socialMedia?.linkedin || '',
    facebook: data.socialMedia?.facebook || ''
  });

  const handleSubmit = () => {
    onComplete({ 
      socialMedia: socialData,
      socialMediaVerified: !!(socialData.linkedin || socialData.facebook)
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Profile (Optional)
        </label>
        <input
          type="url"
          value={socialData.linkedin}
          onChange={(e) => setSocialData(prev => ({ ...prev, linkedin: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://linkedin.com/in/yourprofile"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Facebook Profile (Optional)
        </label>
        <input
          type="url"
          value={socialData.facebook}
          onChange={(e) => setSocialData(prev => ({ ...prev, facebook: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://facebook.com/yourprofile"
        />
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Continue
      </button>
    </div>
  );
}

function LocationStep({ data, onComplete, onError }) {
  const [location, setLocation] = useState(data.location);
  const [getting, setGetting] = useState(false);

  const getCurrentLocation = () => {
    setGetting(true);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          setLocation(locationData);
          setGetting(false);
        },
        (error) => {
          onError({ location: 'Unable to get your location' });
          setGetting(false);
        }
      );
    } else {
      onError({ location: 'Geolocation is not supported by this browser' });
      setGetting(false);
    }
  };

  const handleSubmit = () => {
    onComplete({ 
      location,
      locationVerified: !!location
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center">
        <MapPin className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">
          We can verify you're near your university campus to increase your verification score.
        </p>
      </div>

      {!location ? (
        <button
          onClick={getCurrentLocation}
          disabled={getting}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {getting ? 'Getting Location...' : 'Share My Location'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="bg-green-50 border-l-4 border-green-400 p-4">
            <p className="text-sm text-green-700">
              Location captured successfully!
            </p>
          </div>
          
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
          >
            Continue
          </button>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={() => onComplete({ location: null, locationVerified: false })}
          className="text-gray-500 hover:text-gray-700 text-sm underline"
        >
          Skip location verification
        </button>
      </div>
    </div>
  );
}