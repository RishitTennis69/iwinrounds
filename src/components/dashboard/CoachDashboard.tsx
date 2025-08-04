import React, { useState, useEffect } from 'react';
import { User, OrganizationMember, StudentActivity } from '../../types';
import { supabase, getOrganizationMembers, generateInviteCode } from '../../utils/supabaseClient';
import { Users, UserPlus, Copy, Calendar, Trophy, TrendingUp, Mail, Shield } from 'lucide-react';

const CoachDashboard: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [students, setStudents] = useState<OrganizationMember[]>([]);
  const [coaches, setCoaches] = useState<OrganizationMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<'coach' | 'student'>('student');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<OrganizationMember | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile && profile.organization_id) {
        setUser(profile);

        // Get organization members
        const membersData = await getOrganizationMembers(profile.organization_id);
        setMembers(membersData);
        
        // Separate students and coaches
        setStudents(membersData.filter(m => m.role === 'student'));
        setCoaches(membersData.filter(m => m.role === 'coach'));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateInvite = async () => {
    if (!user?.organization_id) return;

    try {
      const invite = await generateInviteCode(user.organization_id, inviteRole);
      setGeneratedCode(invite.code);
    } catch (error) {
      console.error('Error generating invite code:', error);
    }
  };

  const copyInviteLink = () => {
    if (generatedCode) {
      const inviteUrl = `${window.location.origin}/invite/${generatedCode}`;
      navigator.clipboard.writeText(inviteUrl);
      // You could add a toast notification here
    }
  };

  const getStudentStats = (student: OrganizationMember) => {
    // Mock data for now - in real implementation, this would query debate sessions
    return {
      totalDebates: Math.floor(Math.random() * 20) + 1,
      winRate: Math.floor(Math.random() * 100),
      lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Coach Dashboard</h1>
            <p className="text-gray-600">Manage your students and track their progress</p>
          </div>
          <button
            onClick={() => setShowInviteModal(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
          >
            <UserPlus className="w-5 h-5" />
            <span>Invite Members</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Coaches</p>
                <p className="text-2xl font-bold text-gray-900">{coaches.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active This Week</p>
                <p className="text-2xl font-bold text-gray-900">{Math.floor(students.length * 0.7)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Students</h3>
          </div>
          
          {students.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No students yet</h4>
              <p className="text-gray-600 mb-4">Invite students to start tracking their progress</p>
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Invite Students
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {students.map((student) => {
                const stats = getStudentStats(student);
                return (
                  <div key={student.id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {student.user?.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {student.user?.email}
                          </h4>
                          <p className="text-sm text-gray-600">Student</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{stats.totalDebates}</p>
                          <p>Debates</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{stats.winRate}%</p>
                          <p>Win Rate</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-gray-900">{stats.lastActivity}</p>
                          <p>Last Active</p>
                        </div>
                        <button
                          onClick={() => setSelectedStudent(student)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Coaches List */}
        {coaches.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Coaches</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {coaches.map((coach) => (
                <div key={coach.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {coach.user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {coach.user?.email}
                      </h4>
                      <p className="text-sm text-gray-600">Coach</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite New Member</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as 'coach' | 'student')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="student">Student</option>
                  <option value="coach">Coach</option>
                </select>
              </div>

              {generatedCode ? (
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Invite Link:</p>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={`${window.location.origin}/invite/${generatedCode}`}
                        readOnly
                        className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={copyInviteLink}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Share this link with the person you want to invite. The link expires in 7 days.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleGenerateInvite}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Generate Invite Link
                </button>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setGeneratedCode(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Student Details: {selectedStudent.user?.email}
              </h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {getStudentStats(selectedStudent).totalDebates}
                  </p>
                  <p className="text-sm text-gray-600">Total Debates</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {getStudentStats(selectedStudent).winRate}%
                  </p>
                  <p className="text-sm text-gray-600">Win Rate</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">8.2</p>
                  <p className="text-sm text-gray-600">Avg Score</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium">Climate Change Debate</p>
                    <p className="text-xs text-gray-600">2 days ago • Won as Affirmative</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-medium">Universal Healthcare Debate</p>
                    <p className="text-xs text-gray-600">5 days ago • Lost as Negative</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">AI Feedback Summary</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-green-700 mb-1">Strengths:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      <li>Strong evidence usage and citation</li>
                      <li>Clear logical structure in arguments</li>
                      <li>Effective rebuttal techniques</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700 mb-1">Areas for Improvement:</p>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      <li>Reduce filler words during speeches</li>
                      <li>Improve time management in rebuttals</li>
                      <li>Strengthen impact weighing arguments</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard;