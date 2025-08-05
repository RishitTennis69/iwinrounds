import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Loader2, Building, User, Key, Eye, EyeOff } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  
  // Organization signup fields
  const [userType, setUserType] = useState<'organizer' | 'student' | null>(null);
  const [organizationName, setOrganizationName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showInviteCodeInput, setShowInviteCodeInput] = useState(false);
  
  const { signIn, checkUserExists, resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (loading) {
      console.log('🔍 LoginForm: Already loading, ignoring submit');
      return;
    }
    
    console.log('🔍 LoginForm: Form submitted');
    console.log('🔍 LoginForm: Form validation:', isFormValid());
    console.log('🔍 LoginForm: Current state:', {
      email,
      mode,
      userType,
      firstName,
      lastName,
      organizationName,
      inviteCode,
      showInviteCodeInput,
      loading
    });
    
    setLoading(true);
    setMessage('');
    setIsNewUser(null);

    try {
      console.log('🔍 LoginForm: Starting sign in process');
      console.log('🔍 LoginForm: Email:', email);
      console.log('🔍 LoginForm: Mode:', mode);
      console.log('🔍 LoginForm: User type:', userType);
      console.log('🔍 LoginForm: Organization name:', organizationName);
      
      // Add a small delay to ensure any pending state updates are complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const result = await signIn(
        email,
        password,
        mode === 'signup' ? firstName : undefined,
        mode === 'signup' ? lastName : undefined,
        mode === 'signup' ? (userType || undefined) : undefined,
        mode === 'signup' ? organizationName : undefined,
        mode === 'signup' ? inviteCode : undefined
      );
      
      console.log('🔍 LoginForm: Sign in result:', result);
      setIsNewUser(result.isNewUser);
      
      if (result.isNewUser) {
        setMessage('Account created successfully! You are now signed in.');
      } else {
        setMessage('Signed in successfully!');
      }
      
      setMessageType('success');
      
      // Close the form after successful sign in
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (error) {
      console.error('🔍 LoginForm: Error in handleSubmit:', error);
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    
    // Check user existence if we have a valid email
    if (newEmail && newEmail.includes('@')) {
      try {
        const exists = await checkUserExists(newEmail);
        setIsNewUser(!exists);
      } catch (error) {
        console.error('Error checking user existence:', error);
      }
    }
  };

  const handleUserTypeChange = (type: 'organizer' | 'student') => {
    setUserType(type);
    setOrganizationName('');
    setInviteCode('');
    setShowInviteCodeInput(false);
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

  const handleInviteCodeChange = (affiliated: boolean) => {
    setShowInviteCodeInput(affiliated);
    if (affiliated) {
      setInviteCode('');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setMessage('Please enter your email address first');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await resetPassword(email);
      setMessage('Password reset email sent! Check your inbox.');
      setMessageType('success');
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getButtonText = () => {
    if (loading) return 'Signing in...';
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
    if (mode === 'login') return email && password;
    
    // Signup validation
    if (!email || !password || !firstName || !lastName) return false;
    
    // Require user type selection
    if (!userType) return false;
    
    if (userType === 'organizer' && !organizationName) return false;
    if (userType === 'student' && !organizationName) return false;
    
    if (userType === 'organizer' && showInviteCodeInput && !inviteCode) return false;
    if (userType === 'student' && showInviteCodeInput && !inviteCode) return false;
    
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
                onClick={() => handleUserTypeChange('organizer')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  userType === 'organizer'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-2" />
                <span className="text-sm font-medium">Organizer</span>
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('student')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  userType === 'student'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <User className="w-5 h-5 mx-auto mb-2" />
                <span className="text-sm font-medium">Student</span>
              </button>
            </div>
          </div>
        )}

        {/* Organization Name - only for organization signup */}
        {mode === 'signup' && (userType === 'organizer' || userType === 'student') && (
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
                required={userType === 'organizer' || userType === 'student'}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* Invite Code Input - only for students with invite codes */}
        {mode === 'signup' && userType === 'student' && showInviteCodeInput && (
          <div>
            <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
              Invite Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="inviteCode"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your invite code"
                required={showInviteCodeInput}
                disabled={loading}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter the invite code you received from your organization
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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Key className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Forgot Password Link - only show in login mode */}
        {mode === 'login' && (
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading || !email}
              className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Forgot Password?
            </button>
          </div>
        )}

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
              <span>Signing in...</span>
            </>
          ) : (
            <span>{getButtonText()}</span>
          )}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-600">
          {mode === 'signup' ? 'Create your account to get started' : 'Sign in to your account'}
        </p>
      </div>
    </div>
  );
};

export default LoginForm; 