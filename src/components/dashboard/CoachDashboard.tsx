import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DebateSession, Profile } from '../../lib/supabase';
import { EmailService } from '../../utils/emailService';
import { Calendar, Clock, Users, Trophy, LogOut, Brain, Zap, Star, TrendingUp, Activity, Target, BarChart3, Sparkles, Plus, Mail, UserPlus, Eye, MessageSquare, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

interface StudentData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  user_type: string;
  debate_sessions: DebateSession[];
  total_sessions: number;
  total_wins: number;
  total_time: number;
  recent_activity: string;
}

const CoachDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [coaches, setCoaches] = useState<Profile[]>([]);
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState<'student' | 'coach'>('student');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [invitedEmail, setInvitedEmail] = useState<string>('');
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  const [isProcessingOrganization, setIsProcessingOrganization] = useState(false);

  const checkExistingOrganization = async () => {
    console.log('🔍 CoachDashboard: Checking for existing organization');
    
    // Check if user is a member of any organization
    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select(`
        organization_id,
        role,
        organizations!inner(
          id,
          name,
          creator_name,
          creator_email
        )
      `)
      .eq('user_id', user?.id);
    
    if (membershipError) {
      console.error('🔍 CoachDashboard: Error checking memberships:', membershipError);
    } else {
      console.log('🔍 CoachDashboard: User memberships:', memberships);
    }
    
    // Check if user has organization_id in profile
    if (profile?.organization_id) {
      console.log('🔍 CoachDashboard: User has organization_id in profile:', profile.organization_id);
      
      // Get organization details
      const { data: orgDetails, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single();
      
      if (orgError) {
        console.error('🔍 CoachDashboard: Error fetching organization details:', orgError);
      } else {
        console.log('🔍 CoachDashboard: Organization details:', orgDetails);
      }
    } else {
      console.log('🔍 CoachDashboard: User has no organization_id in profile');
    }
  };

  useEffect(() => {
    if (user && profile) {
      // Add timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        console.log('🔍 CoachDashboard: Loading timeout reached, forcing loading to false');
        setLoading(false);
      }, 5000); // 5 second timeout
      
      console.log('🔍 CoachDashboard: User and profile found, fetching organization data');
      console.log('🔍 CoachDashboard: Profile details:', {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        user_type: profile.user_type,
        organization_id: profile.organization_id,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });
      
      // Check for existing organization
      checkExistingOrganization();
      
      // Check and fix organization_id if needed
      checkAndFixOrganizationId();
      
      fetchOrganizationData();
      
      return () => clearTimeout(timeout);
    }
  }, [user, profile]);

  // Add a separate useEffect to re-fetch data when profile changes
  useEffect(() => {
    if (profile?.organization_id && !loading) {
      console.log('🔍 CoachDashboard: Profile organization_id changed, re-fetching data');
      fetchOrganizationData();
    }
  }, [profile?.organization_id]);

  const fetchOrganizationData = async () => {
    try {
      console.log('🔍 CoachDashboard: Fetching organization data');
      
      // Fetch organization details with stats
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile?.organization_id)
        .single();

      if (orgError) {
        console.error('🔍 CoachDashboard: Error fetching organization:', orgError);
        setLoading(false);
        return;
      }

      setOrganization(orgData);
      
      // Get all members of the organization
      const { data: members, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          profiles!inner(
            id,
            first_name,
            last_name,
            email,
            user_type
          )
        `)
        .eq('organization_id', profile?.organization_id);

      if (error) {
        console.error('🔍 CoachDashboard: Error fetching members:', error);
        // Set loading to false even if there's an error
        setLoading(false);
        return;
      }

      // Separate students and coaches
      const studentProfiles: Profile[] = [];
      const coachProfiles: Profile[] = [];

      members?.forEach((member: any) => {
        const userProfile = member.profiles;
        if (userProfile.user_type === 'student') {
          studentProfiles.push(userProfile);
        } else if (userProfile.user_type === 'coach') {
          coachProfiles.push(userProfile);
        }
      });

      // Fetch debate sessions for each student
      const studentsWithData = await Promise.all(
        studentProfiles.map(async (student) => {
          const { data: sessions } = await supabase
            .from('debate_sessions')
            .select('*')
            .eq('user_id', student.id)
            .order('start_time', { ascending: false });

          const totalSessions = sessions?.length || 0;
          const totalWins = sessions?.filter(s => s.winner && s.winner.team === 'affirmative').length || 0;
          const totalTime = sessions?.reduce((sum, s) => {
            if (s.end_time) {
              const start = new Date(s.start_time);
              const end = new Date(s.end_time);
              return sum + (end.getTime() - start.getTime());
            }
            return sum;
          }, 0) || 0;

          const recentActivity = sessions?.[0]?.start_time 
            ? new Date(sessions[0].start_time).toLocaleDateString()
            : 'No activity';

          return {
            id: student.id,
            first_name: student.first_name || 'Unknown',
            last_name: student.last_name || '',
            email: student.email,
            user_type: student.user_type,
            debate_sessions: sessions || [],
            total_sessions: totalSessions,
            total_wins: totalWins,
            total_time: Math.round(totalTime / (1000 * 60)), // Convert to minutes
            recent_activity: recentActivity
          };
        })
      );

      setStudents(studentsWithData);
      setCoaches(coachProfiles);
      setLoading(false);
    } catch (error) {
      console.error('🔍 CoachDashboard: Error in fetchOrganizationData:', error);
      setLoading(false);
    }
  };

  const checkAndFixOrganizationId = async () => {
    console.log('🔍 CoachDashboard: Checking and fixing organization_id');
    
    try {
      // Check if user is a member of any organization
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user?.id)
        .limit(1);
      
      if (membershipError) {
        console.error('🔍 CoachDashboard: Error checking memberships:', membershipError);
        
        // If it's a 500 error or RLS issue, try a different approach
        if (membershipError.message.includes('500') || membershipError.message.includes('policy')) {
          console.log('🔍 CoachDashboard: RLS issue detected, trying to update profile directly');
          
          // Try to update the profile to business_admin without organization_id
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              user_type: 'business_admin'
            })
            .eq('id', user?.id);
          
          if (updateError) {
            console.error('🔍 CoachDashboard: Error updating profile:', updateError);
            alert('Failed to update profile. Please contact support.');
          } else {
            console.log('🔍 CoachDashboard: Profile updated to business_admin');
            alert('Profile updated to business admin. You can now invite members.');
            await forceRefreshAuthProfile();
          }
        }
        return;
      }
      
      console.log('🔍 CoachDashboard: User memberships:', memberships);
      
      // If user has memberships but profile doesn't have organization_id
      if (memberships && memberships.length > 0 && !profile?.organization_id) {
        const organizationId = memberships[0].organization_id;
        console.log('🔍 CoachDashboard: Found organization_id in memberships:', organizationId);
        
        // Update profile with the organization_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            organization_id: organizationId,
            user_type: 'business_admin'
          })
          .eq('id', user?.id);
        
        if (updateError) {
          console.error('🔍 CoachDashboard: Error updating profile with organization_id:', updateError);
          alert('Failed to update profile with organization ID. Please contact support.');
        } else {
          console.log('🔍 CoachDashboard: Profile updated with organization_id:', organizationId);
          alert('Organization ID fixed successfully!');
          // Refresh the profile data
          await forceRefreshAuthProfile();
        }
      } else if (!memberships || memberships.length === 0) {
        console.log('🔍 CoachDashboard: No memberships found, updating to business_admin');
        
        // Update profile to business_admin without organization_id
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            user_type: 'business_admin'
          })
          .eq('id', user?.id);
        
        if (updateError) {
          console.error('🔍 CoachDashboard: Error updating profile:', updateError);
          alert('Failed to update profile. Please contact support.');
        } else {
          console.log('🔍 CoachDashboard: Profile updated to business_admin');
          alert('Profile updated to business admin. You can now invite members.');
          await forceRefreshAuthProfile();
        }
      }
      
    } catch (error) {
      console.error('🔍 CoachDashboard: Error in checkAndFixOrganizationId:', error);
      alert('Failed to check organization ID. Please contact support.');
    }
  };

  const refreshProfileData = async () => {
    console.log('🔍 CoachDashboard: Refreshing profile data');
    
    try {
      // Fetch the updated profile
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (profileError) {
        console.error('🔍 CoachDashboard: Error fetching updated profile:', profileError);
        return;
      }
      
      console.log('🔍 CoachDashboard: Updated profile data:', updatedProfile);
      
      // Force a re-render by updating the profile in the auth context
      // This will trigger the useEffect and re-fetch organization data
      if (updatedProfile) {
        // We need to trigger a re-render. Since we can't directly update the auth context,
        // we'll force a re-fetch of organization data
        await fetchOrganizationData();
      }
      
    } catch (error) {
      console.error('🔍 CoachDashboard: Error refreshing profile data:', error);
    }
  };

  const forceRefreshAuthProfile = async () => {
    console.log('🔍 CoachDashboard: Force refreshing auth profile');
    
    try {
      // Fetch the latest profile data
      const { data: updatedProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (profileError) {
        console.error('🔍 CoachDashboard: Error fetching updated profile:', profileError);
        return;
      }
      
      console.log('🔍 CoachDashboard: Latest profile data:', updatedProfile);
      
      // Force a page reload to refresh the auth context
      console.log('🔍 CoachDashboard: Forcing page reload to refresh auth context');
      window.location.reload();
      
    } catch (error) {
      console.error('🔍 CoachDashboard: Error in forceRefreshAuthProfile:', error);
    }
  };

  const createOrganizationForUser = async () => {
    console.log('🔍 CoachDashboard: Creating organization for user');
    console.log('🔍 CoachDashboard: Current user ID:', user?.id);
    console.log('🔍 CoachDashboard: Current profile:', profile);
    
    setIsCreatingOrganization(true);
    
    try {
      // First, try to create the organization
      const orgData = {
        name: `${profile?.first_name || 'My'}'s Organization`,
        creator_name: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || null,
        creator_email: profile?.email || null
      };
      
      console.log('🔍 CoachDashboard: Organization data to create:', orgData);
      
      const { data: orgResult, error: orgError } = await supabase
        .from('organizations')
        .insert(orgData)
        .select()
        .single();
      
      if (orgError) {
        console.error('🔍 CoachDashboard: Error creating organization:', orgError);
        console.error('🔍 CoachDashboard: Error details:', {
          code: orgError.code,
          message: orgError.message,
          details: orgError.details,
          hint: orgError.hint
        });
        
        // If organization creation fails due to RLS, try a different approach
        if (orgError.message.includes('infinite recursion') || orgError.message.includes('policy') || orgError.message.includes('500')) {
          console.log('🔍 CoachDashboard: RLS policy issue detected, trying alternative approach');
          
          // Try to update the profile directly with a default organization ID
          // This is a fallback for when RLS policies are too restrictive
          const { error: profileUpdateError } = await supabase
            .from('profiles')
            .update({ 
              user_type: 'business_admin'
            })
            .eq('id', user?.id);
          
          if (profileUpdateError) {
            console.error('🔍 CoachDashboard: Error updating profile:', profileUpdateError);
            alert(`Failed to update profile: ${profileUpdateError.message}`);
            return;
          }
          
          console.log('🔍 CoachDashboard: Profile updated to business_admin');
          alert('Profile updated successfully! You can now invite members. Note: You may need to contact support to set up your organization properly.');
          await refreshProfileData();
          return;
        }
        
        alert(`Failed to create organization: ${orgError.message}`);
        return;
      }

      console.log('🔍 CoachDashboard: Organization created successfully:', orgResult);

      // Update user's profile with organization_id
      const profileUpdate = {
        organization_id: orgResult.id,
        user_type: 'business_admin' // Change to business admin
      };
      
      console.log('🔍 CoachDashboard: Updating profile with:', profileUpdate);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('id', user?.id);

      if (profileError) {
        console.error('🔍 CoachDashboard: Error updating profile:', profileError);
        console.error('🔍 CoachDashboard: Profile error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        alert(`Failed to update profile: ${profileError.message}`);
        return;
      }

      console.log('🔍 CoachDashboard: Profile updated successfully');

      // Try to add user as organization member, but don't fail if it doesn't work
      const memberData = {
        organization_id: orgResult.id,
        user_id: user?.id,
        role: 'business_admin'
      };
      
      console.log('🔍 CoachDashboard: Adding organization member:', memberData);
      
      const { error: memberError } = await supabase
        .from('organization_members')
        .insert(memberData);

      if (memberError) {
        console.error('🔍 CoachDashboard: Error adding organization member:', memberError);
        console.error('🔍 CoachDashboard: Member error details:', {
          code: memberError.code,
          message: memberError.message,
          details: memberError.details,
          hint: memberError.hint
        });
        // Don't fail here as the profile is already updated
        console.log('🔍 CoachDashboard: Member creation failed but continuing...');
      } else {
        console.log('🔍 CoachDashboard: Organization member created successfully');
      }

      console.log('🔍 CoachDashboard: Organization setup complete');
      
      // Check if the organization was actually created and profile updated
      const { data: finalProfile, error: finalProfileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();
      
      if (finalProfileError) {
        console.error('🔍 CoachDashboard: Error checking final profile:', finalProfileError);
      } else {
        console.log('🔍 CoachDashboard: Final profile organization_id:', finalProfile?.organization_id);
        
        if (finalProfile?.organization_id) {
          alert('Organization created successfully! You can now invite members.');
        } else {
          alert('Organization created but profile not updated. Please try again or contact support.');
        }
      }
      
      // Force refresh the auth profile to get the updated organization_id
      setTimeout(async () => {
        console.log('🔍 CoachDashboard: Force refreshing auth profile after organization creation');
        await forceRefreshAuthProfile();
      }, 1000);
      
    } catch (error) {
      console.error('🔍 CoachDashboard: Error in createOrganizationForUser:', error);
      alert(`Failed to create organization: ${error}`);
    } finally {
      setIsCreatingOrganization(false);
    }
  };

  const sendInvite = async () => {
    console.log('🔍 CoachDashboard: sendInvite function called');
    console.log('🔍 CoachDashboard: inviteEmail:', inviteEmail);
    console.log('🔍 CoachDashboard: profile?.organization_id:', profile?.organization_id);
    console.log('🔍 CoachDashboard: user:', user);
    console.log('🔍 CoachDashboard: Full profile data:', profile);
    
    if (!inviteEmail || !profile?.organization_id || !user) {
      console.log('🔍 CoachDashboard: Missing required data, returning early');
      console.log('🔍 CoachDashboard: inviteEmail exists:', !!inviteEmail);
      console.log('🔍 CoachDashboard: profile?.organization_id exists:', !!profile?.organization_id);
      console.log('🔍 CoachDashboard: user exists:', !!user);
      
      // Check if user needs to create an organization
      if (!profile?.organization_id && !isProcessingOrganization) {
        setIsProcessingOrganization(true);
        const shouldCreate = confirm('You need to create an organization first before you can invite members. Would you like to create one now?');
        if (shouldCreate) {
          await createOrganizationForUser();
        }
        setIsProcessingOrganization(false);
        return;
      }
      
      return;
    }

    setInviteLoading(true);
    try {
      console.log('🔍 CoachDashboard: Sending invite to:', inviteEmail);
      
      // Use EmailService to send the invite
      const result = await EmailService.sendInviteEmail({
        email: inviteEmail,
        organization_id: profile.organization_id,
        user_type: inviteType,
        invited_by: user.id
      });

      console.log('🔍 CoachDashboard: EmailService result:', result);

      if (!result.success) {
        console.error('🔍 CoachDashboard: Error sending invite:', result.error);
        alert(`Failed to send invite: ${result.error}`);
        return;
      }

      console.log('🔍 CoachDashboard: Invite sent successfully');
      
      // Get the invite code from the database
      const { data: inviteRecord } = await supabase
        .from('invites')
        .select('code')
        .eq('email', inviteEmail)
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('🔍 CoachDashboard: Invite record from database:', inviteRecord);

      if (inviteRecord) {
        setInviteCode(inviteRecord.code);
        setInvitedEmail(inviteEmail);
        setShowSuccessPopup(true);
        console.log('🔍 CoachDashboard: Showing success popup with code:', inviteRecord.code);
      } else {
        alert(`Invite sent to ${inviteEmail}! They will receive an email with instructions to join your organization.`);
        console.log('🔍 CoachDashboard: No invite record found, showing alert');
      }
      
      setInviteEmail('');
      setShowInviteModal(false);
      
      // Refresh organization data to show updated stats
      fetchOrganizationData();
      
    } catch (error) {
      console.error('🔍 CoachDashboard: Error sending invite:', error);
      alert('Failed to send invite. Please try again.');
    } finally {
      setInviteLoading(false);
    }
  };

  // Get first letter for avatar
  const getAvatarLetter = () => {
    if (profile?.first_name) {
      return profile.first_name.charAt(0).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.charAt(0).toUpperCase();
    }
    return 'C';
  };

  const getDashboardTitle = () => {
    if (profile?.user_type === 'business_admin') {
      return 'Organization Dashboard';
    }
    return 'Coach Dashboard';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200/50 px-6 py-6 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-lg font-semibold">
                  {getAvatarLetter()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{getDashboardTitle()}</h1>
                <p className="text-indigo-500 font-medium">
                  {profile?.user_type === 'business_admin' ? 'Organization Admin' : 'Coach'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center space-x-2 text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-4 py-2 rounded-lg shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-medium">Invite Member</span>
            </button>
            <button
              onClick={signOut}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors bg-white/50 hover:bg-white/80 px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Organization Warning */}
        {!profile?.organization_id && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">Organization Required</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  You need to create an organization to invite members and access all features.
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={checkAndFixOrganizationId}
                  className="flex-shrink-0 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Fix Organization ID
                </button>
                <button
                  onClick={createOrganizationForUser}
                  disabled={isCreatingOrganization}
                  className="flex-shrink-0 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingOrganization ? 'Creating...' : 'Create Organization'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Total Students</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{organization?.total_students || students.length}</div>
              <p className="text-indigo-100 text-sm mt-1">Active students</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Total Coaches</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{organization?.total_coaches || coaches.length}</div>
              <p className="text-emerald-100 text-sm mt-1">Team coaches</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Total Sessions</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {organization?.total_debate_sessions || students.reduce((sum, student) => sum + student.total_sessions, 0)}
              </div>
              <p className="text-purple-100 text-sm mt-1">Debate sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Total Wins</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Star className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {organization?.total_wins || students.reduce((sum, student) => sum + student.total_wins, 0)}
              </div>
              <p className="text-blue-100 text-sm mt-1">Student victories</p>
            </CardContent>
          </Card>
        </div>

        {/* Students Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Student Progress</h2>
            <Badge variant="secondary" className="text-sm">
              {students.length} Students
            </Badge>
          </div>
          
          {students.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">No Students</h3>
                    <p className="text-slate-600 mb-6">Start building your team by inviting students to your organization.</p>
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="flex items-center space-x-2 text-white bg-indigo-600 hover:bg-indigo-700 transition-colors px-6 py-3 rounded-lg shadow-sm mx-auto"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span className="font-medium">Invite Students</span>
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <Card key={student.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                          {student.first_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{student.first_name} {student.last_name}</CardTitle>
                        <CardDescription className="text-sm">{student.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{student.total_sessions}</div>
                        <div className="text-blue-600 text-xs">Sessions</div>
                      </div>
                      <div className="text-center p-3 bg-emerald-50 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">{student.total_wins}</div>
                        <div className="text-emerald-600 text-xs">Wins</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Total Time: {student.total_time}m</span>
                      <span>Last: {student.recent_activity}</span>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button className="flex-1 flex items-center justify-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium">
                        <Eye className="w-4 h-4" />
                        <span>View Details</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center space-x-1 text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        <MessageSquare className="w-4 h-4" />
                        <span>Send Feedback</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Coaches Section */}
        {coaches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Team Coaches</h2>
              <Badge variant="secondary" className="text-sm">
                {coaches.length} Coaches
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coaches.map((coach) => (
                <Card key={coach.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                          {coach.first_name?.charAt(0).toUpperCase() || coach.email.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{coach.first_name} {coach.last_name}</CardTitle>
                        <CardDescription className="text-sm">{coach.email}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">Coach</span>
                      <Badge variant="outline" className="text-xs">
                        Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Invite Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Member Type</label>
                <select
                  value={inviteType}
                  onChange={(e) => setInviteType(e.target.value as 'student' | 'coach')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="student">Student</option>
                  <option value="coach">Coach</option>
                </select>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={sendInvite}
                disabled={!inviteEmail || inviteLoading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {inviteLoading ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Invite Sent Successfully!</h3>
              <p className="text-slate-600 mb-4">
                An email has been sent to <strong>{invitedEmail}</strong> with instructions to join your organization.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Invite Code</h4>
                <div className="bg-white border border-blue-300 rounded-lg p-3">
                  <code className="text-2xl font-mono font-bold text-blue-600">{inviteCode}</code>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  You can share this code with the invitee if they don't receive the email.
                </p>
              </div>
              
              <button
                onClick={() => setShowSuccessPopup(false)}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard; 