import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Profile, DebateSession, Organization } from '../../lib/supabase';
import { Users, Calendar, Clock, Trophy, Eye, Plus, LogOut, Building } from 'lucide-react';

interface StudentWithStats extends Profile {
  debateSessions: DebateSession[];
  totalSessions: number;
  completedSessions: number;
  totalHints: number;
  lastActivity: string | null;
}

const CoachDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithStats | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  useEffect(() => {
    if (user && profile?.organization_id) {
      fetchOrganizationData();
    }
  }, [user, profile]);

  const fetchOrganizationData = async () => {
    try {
      // Fetch organization details
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile!.organization_id)
        .single();

      if (orgError) {
        console.error('Error fetching organization:', orgError);
      } else {
        setOrganization(orgData);
      }

      // Fetch all students in the organization
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile!.organization_id)
        .eq('user_type', 'student');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
      } else {
        // Fetch debate sessions for each student
        const studentsWithStats = await Promise.all(
          (studentsData || []).map(async (student: any) => {
            const { data: sessions } = await supabase
              .from('debate_sessions')
              .select('*')
              .eq('user_id', student.id)
              .order('created_at', { ascending: false });

            const debateSessions = sessions || [];
            const totalSessions = debateSessions.length;
            const completedSessions = debateSessions.filter((s: any) => s.end_time).length;
            const totalHints = debateSessions.reduce((sum: number, s: any) => sum + s.hints_used, 0);
            const lastActivity = debateSessions.length > 0 ? debateSessions[0].created_at : null;

            return {
              ...student,
              debateSessions,
              totalSessions,
              completedSessions,
              totalHints,
              lastActivity,
            };
          })
        );

        setStudents(studentsWithStats);
      }
    } catch (error) {
      console.error('Error in fetchOrganizationData:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDuration = (startTime: string, endTime: string | null) => {
    if (!endTime) return 'In Progress';
    
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getOrganizationStats = () => {
    const totalStudents = students.length;
    const totalSessions = students.reduce((sum, s) => sum + s.totalSessions, 0);
    const totalHints = students.reduce((sum, s) => sum + s.totalHints, 0);
    
    return { totalStudents, totalSessions, totalHints };
  };

  const stats = getOrganizationStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Coach Dashboard</h1>
            <p className="text-gray-600">
              {organization?.name} • {profile?.user_type === 'business_admin' ? 'Admin' : 'Coach'}
            </p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Organization Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Debates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Hints Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalHints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Students</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {students.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-400 mb-4">
                  <Users className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No students yet</h3>
                <p className="text-gray-600">Students will appear here once they join your organization</p>
              </div>
            ) : (
              students.map((student) => (
                <div key={student.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {student.email}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{student.totalSessions} debates</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Trophy className="w-4 h-4" />
                          <span>{student.completedSessions} completed</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>
                            {student.lastActivity 
                              ? `Last active: ${formatDate(student.lastActivity)}`
                              : 'No activity yet'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedStudent(student);
                        setShowStudentDetails(true);
                      }}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedStudent.email}
              </h2>
              <button
                onClick={() => setShowStudentDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {/* Student Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Total Debates</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStudent.totalSessions}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStudent.completedSessions}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-600">Hints Used</p>
                <p className="text-2xl font-bold text-gray-900">{selectedStudent.totalHints}</p>
              </div>
            </div>

            {/* Debate History */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Debate History</h3>
              
              {selectedStudent.debateSessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No debates completed yet
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedStudent.debateSessions.map((session) => (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{session.topic}</h4>
                        <div className="flex items-center space-x-2">
                          {session.winner && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              session.winner.team === 'affirmative' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {session.winner.team} won
                            </span>
                          )}
                          {!session.end_time && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              In Progress
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(session.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatDuration(session.start_time, session.end_time)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4" />
                          <span>{session.speakers?.length || 0} speakers</span>
                        </div>
                      </div>
                      
                      {session.summary && (
                        <p className="text-sm text-gray-700">{session.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachDashboard; 