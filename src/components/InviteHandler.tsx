import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInviteCode, getCurrentUser } from '../utils/supabaseClient';
import { UserPlus, CheckCircle, AlertCircle } from 'lucide-react';
import AuthForm from './auth/AuthForm';

const InviteHandler: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);

  useEffect(() => {
    checkUserAndInvite();
  }, [code]);

  const checkUserAndInvite = async () => {
    try {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);

      if (currentUser && code) {
        // User is logged in, process the invite
        await processInvite();
      } else if (code) {
        // User not logged in, show auth form
        setIsLoading(false);
      }
    } catch (err) {
      setError('Failed to process invite');
      setIsLoading(false);
    }
  };

  const processInvite = async () => {
    if (!code) return;

    try {
      const invite = await useInviteCode(code);
      setInviteInfo(invite);
      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    // After successful auth, process the invite
    await processInvite();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing invite...</p>
        </div>
      </div>
    );
  }

  if (success && inviteInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-green-200/30">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the team!</h2>
            <p className="text-gray-600 mb-4">
              You've successfully joined <strong>{inviteInfo.organizations?.name}</strong> as a {inviteInfo.role}.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to your dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 border border-red-200/30">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Invite</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Team</h2>
            <p className="text-gray-600">Sign in to accept your invitation</p>
          </div>
          <AuthForm onSuccess={handleAuthSuccess} />
        </div>
      </div>
    );
  }

  return null;
};

export default InviteHandler;