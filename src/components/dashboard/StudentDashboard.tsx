import React, { useState, useEffect } from 'react';
import { DebateSession } from '../../types';
import { supabase } from '../../utils/supabaseClient';
import { Play, Calendar, Trophy, TrendingUp, Plus } from 'lucide-react';

interface StudentDashboardProps {
  onStartNewDebate: () => void;
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ onStartNewDebate }) => {
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    loadUserAndDebates();
  }, []);

  const loadUserAndDebates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUser(user);

      // Load user's debate sessions from localStorage for now
      // In a real implementation, this would come from Supabase
      const savedSessions = localStorage.getItem(`debates_${user.id}`);
      if (savedSessions) {
        setDebates(JSON.parse(savedSessions));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDebateStats = () => {
    const totalDebates = debates.length;
    const completedDebates = debates.filter(d => d.winner).length;
    const winRate = completedDebates > 0 
      ? debates.filter(d => d.winner && d.speakers.some(s => s.team === d.winner?.team && s.points > 27)).length / completedDebates * 100
      : 0;
    
    return { totalDebates, completedDebates, winRate };
  };

  const stats = getDebateStats();

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'Student'}!
          </h1>
          <p className="text-gray-600">Track your progress and start new debates</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Debates</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalDebates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedDebates}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.winRate.toFixed(0)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Start New Debate Button */}
        <div className="mb-8">
          <button
            onClick={onStartNewDebate}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span>Start New Debate</span>
          </button>
        </div>

        {/* Recent Debates */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Debates</h3>
          </div>
          
          {debates.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No debates yet</h4>
              <p className="text-gray-600 mb-4">Start your first debate to see your progress here</p>
              <button
                onClick={onStartNewDebate}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Your First Debate
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {debates.slice(0, 10).map((debate) => (
                <div key={debate.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {debate.topic.length > 80 ? debate.topic.substring(0, 80) + '...' : debate.topic}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{formatDate(debate.startTime)}</span>
                        <span>•</span>
                        <span>{debate.points.length} speeches</span>
                        {debate.winner && (
                          <>
                            <span>•</span>
                            <span className={`font-medium ${
                              debate.winner.team === 'affirmative' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {debate.winner.team} won
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {debate.winner ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;