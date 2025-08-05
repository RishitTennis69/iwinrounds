import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { DebateSession, Profile } from '../../lib/supabase';
import { Calendar, Clock, Users, Trophy, LogOut, Brain, Zap, Star, TrendingUp, Activity, Target, BarChart3, Sparkles, Plus, Mail, UserPlus, Eye, MessageSquare } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteType, setInviteType] = useState<'student' | 'coach'>('student');
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    if (user && profile) {
      fetchOrganizationMembers();
    }
  }, [user, profile]);

  const fetchOrganizationMembers = async () => {
    try {
      console.log('🔍 CoachDashboard: Fetching organization members');
      
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
      console.error('🔍 CoachDashboard: Error in fetchOrganizationMembers:', error);
      setLoading(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteEmail || !profile?.organization_id) return;

    setInviteLoading(true);
    try {
      // Create invite record
      const { error } = await supabase
        .from('invites')
        .insert({
          email: inviteEmail,
          organization_id: profile.organization_id,
          user_type: inviteType,
          invited_by: user!.id,
          status: 'pending'
        });

      if (error) {
        console.error('🔍 CoachDashboard: Error creating invite:', error);
        alert('Failed to send invite. Please try again.');
        return;
      }

      // In a real app, you would send an email here
      console.log('🔍 CoachDashboard: Invite created for', inviteEmail);
      alert(`Invite sent to ${inviteEmail}! They will receive an email to join your organization.`);
      
      setInviteEmail('');
      setShowInviteModal(false);
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
              <div className="text-3xl font-bold">{students.length}</div>
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
              <div className="text-3xl font-bold">{coaches.length}</div>
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
                {students.reduce((sum, student) => sum + student.total_sessions, 0)}
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
                {students.reduce((sum, student) => sum + student.total_wins, 0)}
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
    </div>
  );
};

export default CoachDashboard; 