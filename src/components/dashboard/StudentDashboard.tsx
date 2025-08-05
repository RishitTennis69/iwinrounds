import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DebateSessionService } from '../../utils/debateSessionService';
import { DebateSession } from '../../lib/supabase';
import { Calendar, Clock, Users, Trophy, Plus, LogOut, Brain, Zap, Star, TrendingUp, Activity, Target, BarChart3, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

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
    const totalWins = debateSessions.filter(s => s.winner && s.winner.team === 'affirmative').length;
    const totalTimeMinutes = completedSessions > 0 
      ? Math.round(debateSessions
          .filter(s => s.end_time)
          .reduce((sum, s) => {
            const start = new Date(s.start_time);
            const end = new Date(s.end_time!);
            return sum + (end.getTime() - start.getTime());
          }, 0) / (1000 * 60))
      : 0;
    
    return { totalSessions, completedSessions, totalHints, totalWins, totalTimeMinutes };
  };

  const stats = getSessionStats();

  // Get first name from profile or fallback to email
  const getFirstName = () => {
    if (profile?.first_name) {
      return profile.first_name;
    }
    if (!profile?.email) return 'User';
    const email = profile.email;
    const atIndex = email.indexOf('@');
    if (atIndex === -1) return email;
    const name = email.substring(0, atIndex);
    return name.charAt(0).toUpperCase() + name.slice(1);
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
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-lg font-semibold">
                  {getFirstName().charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Student Dashboard</h1>
                <p className="text-blue-500 font-medium">Welcome back</p>
              </div>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition-colors bg-white/50 hover:bg-white/80 px-4 py-2 rounded-lg border border-slate-200 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Total Debates</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalSessions}</div>
              <p className="text-blue-100 text-sm mt-1">Sessions completed</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Wins</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalWins}</div>
              <p className="text-emerald-100 text-sm mt-1">Victories achieved</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Hints Used</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Brain className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalHints}</div>
              <p className="text-purple-100 text-sm mt-1">AI assistance</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Total Time</CardTitle>
                <div className="p-2 bg-white/20 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalTimeMinutes}m</div>
              <p className="text-indigo-100 text-sm mt-1">Minutes practiced</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900">Quick Actions</CardTitle>
                  <CardDescription>Start a new debate or practice session</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Powered
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setShowModeSelection(true)}
                className="flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>Start New Debate</span>
              </button>
            </CardContent>
          </Card>
        </div>

        {/* Debate History */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/50 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-slate-900">Debate History</CardTitle>
                  <CardDescription>Your recent debate sessions and performance</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="border-slate-200 text-slate-600">
                {debateSessions.length} sessions
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            {debateSessions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-slate-300 mb-4">
                  <Zap className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No debates yet</h3>
                <p className="text-slate-600 mb-6">Start your first debate to see your history here</p>
                <button
                  onClick={() => setShowModeSelection(true)}
                  className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Start First Debate</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {debateSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-lg border border-slate-200/50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {session.topic}
                        </h3>
                        {session.winner && (
                          <Badge 
                            variant={session.winner.team === 'affirmative' ? 'default' : 'secondary'}
                            className={session.winner.team === 'affirmative' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}
                          >
                            {session.winner.team} won
                          </Badge>
                        )}
                        {!session.end_time && (
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                            In Progress
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-600">
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
                        <div className="flex items-center space-x-1">
                          <Brain className="w-4 h-4" />
                          <span>{session.hints_used} hints</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Mode Selection Modal */}
      {showModeSelection && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl relative border-slate-200/50 shadow-2xl bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-slate-900">Choose Your Mode</CardTitle>
                  <CardDescription>Select how you'd like to practice and improve your debate skills</CardDescription>
                </div>
                <button
                  onClick={() => setShowModeSelection(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button
                  onClick={() => {
                    setShowModeSelection(false);
                    window.location.href = '/debate';
                  }}
                  className="group p-6 bg-white border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="text-4xl mb-4">🏛️</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-blue-600">
                    Debate Mode
                  </h3>
                  <p className="text-slate-600">Practice with AI opponents in structured debate formats</p>
                </button>

                <button
                  onClick={() => {
                    setShowModeSelection(false);
                    window.location.href = '/practice';
                  }}
                  className="group p-6 bg-white border-2 border-indigo-200 rounded-xl hover:border-indigo-400 hover:shadow-lg transition-all duration-200 text-left"
                >
                  <div className="text-4xl mb-4">🎯</div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-indigo-600">
                    Practice Mode
                  </h3>
                  <p className="text-slate-600">Focus on specific skills and receive detailed feedback</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard; 