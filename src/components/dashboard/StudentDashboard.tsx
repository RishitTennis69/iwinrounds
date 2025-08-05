import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DebateSessionService } from '../../utils/debateSessionService';
import { DebateSession } from '../../lib/supabase';
import { Calendar, Clock, Users, Trophy, Plus, LogOut, Brain, Target, Zap } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [debateSessions, setDebateSessions] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModeSelection, setShowModeSelection] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDebateSessions();
    }
  }, [user]);

  const fetchDebateSessions = async () => {
    try {
      const data = await DebateSessionService.getUserSessions(user!.id);
      setDebateSessions(data || []);
    } catch (error) {
      console.error('Error in fetchDebateSessions:', error);
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

  const getSessionStats = () => {
    const totalSessions = debateSessions.length;
    const completedSessions = debateSessions.filter(s => s.end_time).length;
    const totalHints = debateSessions.reduce((sum, s) => sum + s.hints_used, 0);
    
    return { totalSessions, completedSessions, totalHints };
  };

  const stats = getSessionStats();

  // Extract first name from email (fallback to email if no @ found)
  const getFirstName = () => {
    if (!profile?.email) return 'User';
    const email = profile.email;
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
    const name = email.substring(0, atIndex);
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-200/50 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-blue-600 font-medium">Welcome back, {getFirstName()}! 👋</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white/50 hover:bg-white/80 px-4 py-2 rounded-lg border border-gray-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl shadow-lg p-6 border border-blue-400/20">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-blue-100 text-sm font-medium">Total Debates</p>
                <p className="text-2xl font-bold">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6 border border-green-400/20">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-xl">
                <Trophy className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-green-100 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold">{stats.completedSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl shadow-lg p-6 border border-purple-400/20">
            <div className="flex items-center">
              <div className="p-3 bg-white/20 rounded-xl">
                <Brain className="w-6 h-6" />
              </div>
              <div className="ml-4">
                <p className="text-purple-100 text-sm font-medium">Hints Used</p>
                <p className="text-2xl font-bold">{stats.totalHints}</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Debate Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowModeSelection(true)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <Plus className="w-6 h-6" />
            <span className="text-lg font-semibold">Start New Debate</span>
          </button>
        </div>

        {/* Debate History */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50">
          <div className="px-6 py-4 border-b border-gray-200/50">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2 text-blue-600" />
              Debate History
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200/50">
            {debateSessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 mb-4">
                  <Zap className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No debates yet</h3>
                <p className="text-gray-600">Start your first debate to see your history here</p>
              </div>
            ) : (
              debateSessions.map((session) => (
                <div key={session.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {session.topic}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
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
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {session.winner && (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          session.winner.team === 'affirmative' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.winner.team} won
                        </span>
                      )}
                      {!session.end_time && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {session.summary && (
                    <p className="text-sm text-gray-600 mt-2">{session.summary}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mode Selection Modal */}
      {showModeSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl relative border border-gray-200">
            <button
              onClick={() => setShowModeSelection(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Mode</h2>
              <p className="text-gray-600">Select how you'd like to practice and improve your debate skills</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => {
                  setShowModeSelection(false);
                  // Navigate to debate mode
                  window.location.href = '/debate';
                }}
                className="bg-white border-2 border-blue-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="text-4xl mb-4">🏛️</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                  Debate Mode
                </h3>
                <p className="text-gray-700">Practice with AI opponents in structured debate formats</p>
              </button>

              <button
                onClick={() => {
                  setShowModeSelection(false);
                  // Navigate to practice mode
                  window.location.href = '/practice';
                }}
                className="bg-white border-2 border-indigo-200 rounded-xl p-6 hover:border-indigo-400 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-indigo-600">
                  Practice Mode
                </h3>
                <p className="text-gray-700">Focus on specific skills and receive detailed feedback</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard; 