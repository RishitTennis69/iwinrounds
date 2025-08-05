import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Mail, Loader2 } from 'lucide-react';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);
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
        setMessage('Welcome! Check your email for the signup link to create your account.');
      } else {
        setMessage('Welcome back! Check your email for the login link.');
      }
      
      setMessageType('success');
      if (onSuccess) {
        onSuccess();
      }
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

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-md border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to ReasynAI</h1>
          <p className="text-gray-600">
            {isNewUser === null 
              ? 'Enter your email to continue'
              : isNewUser 
                ? 'Create your account'
                : 'Sign in to your account'
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className={`p-4 rounded-lg ${
              messageType === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-700' 
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending magic link...</span>
              </>
            ) : (
              <span>
                {isNewUser === null 
                  ? 'Continue with Email'
                  : isNewUser 
                    ? 'Create Account'
                    : 'Sign In'
                }
              </span>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {isNewUser === null 
              ? 'We\'ll send you a magic link to sign in securely'
              : isNewUser 
                ? 'We\'ll send you a magic link to create your account'
                : 'We\'ll send you a magic link to sign in securely'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 