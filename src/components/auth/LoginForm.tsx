import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { testMagicLink } from '../../utils/testEmail';
import { Mail, Loader2, Building, User, Key } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  
  // Organization signup fields
  const [userType, setUserType] = useState<'individual' | 'organization' | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [isAffiliated, setIsAffiliated] = useState<boolean | null>(null);
  const [entryCode, setEntryCode] = useState('');
  const [showEntryCodeInput, setShowEntryCodeInput] = useState(false);
  
  const { signIn, checkUserExists } = useAuth();

  const testMagicLinkFunction = async () => {
    if (!email) {
      setMessage('Please enter an email first');
      setMessageType('error');
      return;
    }
    
    setLoading(true);
    setMessage('');
    
    try {
      console.log('🔍 LoginForm: Testing magic link for:', email);
      const result = await testMagicLink(email);
      
      if (result.success) {
        setMessage('Test magic link sent successfully! Check your email.');
        setMessageType('success');
      } else {
        setMessage(`Test failed: ${result.error}`);
        setMessageType('error');
      }
    } catch (error) {
      console.error('🔍 LoginForm: Test error:', error);
      setMessage(`Test error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsNewUser(null);

    try {
      console.log('🔍 LoginForm: Starting sign in process');
      console.log('🔍 LoginForm: Email:', email);
      console.log('🔍 LoginForm: Mode:', mode);
      console.log('🔍 LoginForm: User type:', userType);
      console.log('🔍 LoginForm: Organization name:', organizationName);
      
      const result = await signIn(
        email, 
        mode === 'signup' ? firstName : undefined,
        mode === 'signup' ? lastName : undefined,
        mode === 'signup' ? (userType || undefined) : undefined,
        mode === 'signup' ? organizationName : undefined,
        mode === 'signup' ? entryCode : undefined
      );
      
      console.log('🔍 LoginForm: Sign in result:', result);
      setIsNewUser(result.isNewUser);
      
      if (result.isNewUser) {
        setMessage('Magic link sent! Check your email to create your account.');
      } else {
        setMessage('Magic link sent! Check your email to sign in.');
      }
      
      setMessageType('success');
    } catch (error) {
      console.error('🔍 LoginForm: Error in handleSubmit:', error);
      setMessage(`Error sending login link: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    setMessage('');
    setIsNewUser(null);
    
    // Only check user existence if we have a valid email and user type is selected
    if (newEmail && newEmail.includes('@') && userType) {
      try {
        const exists = await checkUserExists(newEmail);
        setIsNewUser(!exists);
      } catch (error) {
        console.error('Error checking user existence:', error);
      }
    }
  };

  const handleUserTypeChange = (type: 'individual' | 'organization') => {
    setUserType(type);
    setOrganizationName('');
    setIsAffiliated(null);
    setEntryCode('');
    setShowEntryCodeInput(false);
    setIsNewUser(null); // Reset user existence check when type changes
    
    // Re-check user existence if we have a valid email
    if (email && email.includes('@')) {
      checkUserExists(email).then(exists => {
        setIsNewUser(!exists);
      }).catch(error => {
        console.error('Error checking user existence:', error);
      });
    }
  };

  const handleAffiliationChange = (affiliated: boolean) => {
    setIsAffiliated(affiliated);
    if (affiliated) {
      setShowEntryCodeInput(true);
    } else {
      setShowEntryCodeInput(false);
      setEntryCode('');
    }
  };

  const getButtonText = () => {
    if (loading) return 'Sending magic link...';
    if (mode === 'signup') return 'Create Account';
    return 'Sign In';
  };

  const getDescription = () => {
    if (mode === 'signup') {
      return isNewUser === null 
        ? 'Create your account to get started'
        : isNewUser 
          ? 'Create your account'
          : 'Account already exists - switch to Sign In';
    } else {
      return isNewUser === null 
        ? 'Sign in to your account'
        : isNewUser 
          ? 'Account not found - switch to Sign Up'
          : 'Sign in to your account';
    }
  };

  const isFormValid = () => {
    if (mode === 'login') return email;
    
    // Signup validation
    if (!email || !firstName || !lastName) return false;
    
    // Require user type selection
    if (!userType) return false;
    
    if (userType === 'organization' && !organizationName) return false;
    
    if (userType === 'individual' && isAffiliated === true && !entryCode) return false;
    
    return true;
  };

  return (
    <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          ✕
        </button>
      )}
      
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to ReasynAI</h1>
        <p className="text-gray-600">{getDescription()}</p>
      </div>

      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        <button
          type="button"
          onClick={() => setMode('signup')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'signup'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sign Up
        </button>
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            mode === 'login'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Sign In
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name fields - only show in signup mode */}
        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="First name"
                  required={mode === 'signup'}
                  disabled={loading}
                />
              </div>
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Last name"
                  required={mode === 'signup'}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        )}

        {/* User Type Selection - only in signup mode */}
        {mode === 'signup' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              I am a:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleUserTypeChange('individual')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  userType === 'individual'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-2" />
                <span className="text-sm font-medium">Individual</span>
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('organization')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  userType === 'organization'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Building className="w-5 h-5 mx-auto mb-2" />
                <span className="text-sm font-medium">Organization</span>
              </button>
            </div>
          </div>
        )}

        {/* Organization Name - only for organization signup */}
        {mode === 'signup' && userType === 'organization' && (
          <div>
            <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-2">
              Organization Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter organization name"
                required={userType === 'organization'}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Affiliation Question - only for individual signup */}
        {mode === 'signup' && userType === 'individual' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Are you affiliated with any organizations that use ReasynAI?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleAffiliationChange(true)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isAffiliated === true
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">Yes</span>
              </button>
              <button
                type="button"
                onClick={() => handleAffiliationChange(false)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  isAffiliated === false
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">No</span>
              </button>
            </div>
          </div>
        )}

        {/* Entry Code Input - only for affiliated individuals */}
        {mode === 'signup' && userType === 'individual' && showEntryCodeInput && (
          <div>
            <label htmlFor="entryCode" className="block text-sm font-medium text-gray-700 mb-2">
              Organization Entry Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="entryCode"
                type="text"
                value={entryCode}
                onChange={(e) => setEntryCode(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your organization code"
                required={showEntryCodeInput}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              You can also join an organization later from your dashboard
            </p>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>
          
          {/* Show user status indicator */}
          {isNewUser !== null && email && userType && (
            <div className="mt-2 text-sm">
              {isNewUser ? (
                <span className="text-blue-600">🆕 New user - will create account</span>
              ) : (
                <span className="text-green-600">✅ Existing user - will sign in</span>
              )}
            </div>
          )}
        </div>

        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            messageType === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-700' 
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !isFormValid()}
          className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending magic link...</span>
            </>
          ) : (
            <span>{getButtonText()}</span>
          )}
        </button>

        {/* Test button for debugging */}
        <button
          type="button"
          onClick={testMagicLinkFunction}
          disabled={loading || !email}
          className="w-full flex items-center justify-center space-x-2 bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Test Magic Link
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          We'll send you a magic link to {mode === 'signup' ? 'create your account' : 'sign in securely'}
        </p>
      </div>
    </div>
  );
};

export default LoginForm; 