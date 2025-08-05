import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { CheckCircle, XCircle, Loader2, Users, Building } from 'lucide-react';

interface JoinOrganizationProps {
  inviteCode?: string;
  onSuccess?: () => void;
}

const JoinOrganization: React.FC<JoinOrganizationProps> = ({ inviteCode, onSuccess }) => {
  const { user, profile } = useAuth();
  const [code, setCode] = useState(inviteCode || '');
  const [loading, setLoading] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (inviteCode) {
      validateInviteCode(inviteCode);
    }
  }, [inviteCode]);

  const validateInviteCode = async (codeToValidate: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: invite, error } = await supabase
        .from('invites')
        .select(`
          *,
          organizations!inner(
            name,
            creator_name
          )
        `)
        .eq('code', codeToValidate)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !invite) {
        setError('Invalid or expired invite code. Please check the code and try again.');
        return;
      }

      setInviteData(invite);
    } catch (error) {
      console.error('🔍 JoinOrganization: Error validating invite:', error);
      setError('Failed to validate invite code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOrganization = async () => {
    if (!user || !inviteData) return;

    setLoading(true);
    setError(null);

    try {
      // Check if user already has a profile
      if (!profile) {
        setError('Please complete your profile setup first.');
        return;
      }

      // Check if user is already in an organization
      if (profile.organization_id) {
        setError('You are already part of an organization. Please leave your current organization first.');
        return;
      }

      // Add user to organization
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: inviteData.organization_id,
          user_id: user.id,
          role: inviteData.user_type === 'student' ? 'student' : 'coach'
        });

      if (memberError) {
        console.error('🔍 JoinOrganization: Error adding member:', memberError);
        setError('Failed to join organization. Please try again.');
        return;
      }

      // Update user's profile with organization
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          organization_id: inviteData.organization_id,
          user_type: inviteData.user_type
        })
        .eq('id', user.id);

      if (profileError) {
        console.error('🔍 JoinOrganization: Error updating profile:', profileError);
        setError('Failed to update profile. Please try again.');
        return;
      }

      // Mark invite as used
      const { error: inviteError } = await supabase
        .from('invites')
        .update({ status: 'accepted' })
        .eq('id', inviteData.id);

      if (inviteError) {
        console.error('🔍 JoinOrganization: Error updating invite:', inviteError);
        // Don't fail the whole process for this
      }

      setSuccess(true);
      console.log('🔍 JoinOrganization: Successfully joined organization');
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('🔍 JoinOrganization: Error joining organization:', error);
      setError('Failed to join organization. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (code.trim()) {
      validateInviteCode(code.trim());
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-600">Successfully Joined!</CardTitle>
            <CardDescription>
              You are now a member of {inviteData?.organizations?.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <button 
              onClick={() => window.location.href = '/dashboard'} 
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Join Organization</CardTitle>
          <CardDescription>
            Enter your invite code to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full text-center text-lg font-mono px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center">
                  <XCircle className="h-4 w-4 text-red-600 mr-2" />
                  <span className="text-red-800">{error}</span>
                </div>
              </div>
            )}

            {inviteData && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                  <div>
                    <div className="font-semibold text-green-800">Valid Invite Found!</div>
                    <div className="text-sm text-green-700 mt-1">
                      Organization: {inviteData.organizations?.name}<br />
                      Role: {inviteData.user_type}<br />
                      Invited by: {inviteData.organizations?.creator_name}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading || !code.trim()}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                    Validating...
                  </>
                ) : (
                  'Validate Code'
                )}
              </button>

              {inviteData && (
                <button
                  type="button"
                  onClick={handleJoinOrganization}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin inline" />
                      Joining...
                    </>
                  ) : (
                    'Join Organization'
                  )}
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinOrganization; 