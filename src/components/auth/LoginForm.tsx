import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Loader2 } from 'lucide-react';

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
  const [mode, setMode] = useState<'login' | 'signup'>('signup'); // Default to signup
  const { signIn, checkUserExists } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setIsNewUser(null);

    try {
      const result = await signIn(email);
      setIsNewUser(result.isNewUser);
      
      if (result.isNewUser) {
        setMessage('Magic link sent! Check your email to create your account.');
      } else {
        setMessage('Magic link sent! Check your email to sign in.');
      }
      
      setMessageType('success');
      // Don't call onSuccess to keep popup open
    } catch (error) {
      setMessage('Error sending login link. Please try again.');
      setMessageType('error');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear previous state
    setMessage('');
    setIsNewUser(null);
    
    // Check if user exists when email is valid
    if (newEmail && newEmail.includes('@')) {
      try {
        const exists = await checkUserExists(newEmail);
        setIsNewUser(!exists);
      } catch (error) {
        // Silently handle error - don't show to user
        console.error('Error checking user existence:', error);
      }
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

  return (
    <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200 relative">
      {/* Close button */}
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

      {/* Toggle between Login and Signup */}
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
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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
          {isNewUser !== null && email && (
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
          disabled={loading || !email || (mode === 'signup' && (!firstName || !lastName))}
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