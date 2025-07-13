import React from 'react';
import { DebateSession } from '../types';
import { Trophy, Award, Users, Clock } from 'lucide-react';
import ContentRecommendations from './ContentRecommendations';

interface FinalAnalysisProps {
  session: DebateSession;
}

const FinalAnalysis: React.FC<FinalAnalysisProps> = ({ session }) => {
  const formatDuration = (start: Date, end: Date) => {
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const affirmativeSpeakers = session.speakers.filter(s => s.team === 'affirmative');
  const negativeSpeakers = session.speakers.filter(s => s.team === 'negative');

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
            Final Analysis
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Winner Section */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  Winner: {session.winner?.team === 'affirmative' ? 'Affirmative Team' : 'Negative Team'}
                </h4>
                <p className="text-gray-700">{session.winner?.reasoning}</p>
              </div>
              <div className={`text-6xl ${session.winner?.team === 'affirmative' ? 'text-green-500' : 'text-red-500'}`}>
                🏆
              </div>
            </div>
          </div>

          {/* Speaker Scores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Affirmative Team */}
            <div className="bg-green-50 rounded-lg p-4">
              <h5 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Affirmative Team
              </h5>
              <div className="space-y-3">
                {affirmativeSpeakers.map((speaker) => (
                  <div key={speaker.id} className="bg-white rounded-lg p-3 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{speaker.name}</span>
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">{speaker.points}</span>
                      </div>
                    </div>
                    {speaker.feedback && (
                      <div className="mt-2 text-sm text-blue-700 bg-blue-50 rounded p-2">
                        <span className="font-semibold">Feedback:</span> {speaker.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Negative Team */}
            <div className="bg-red-50 rounded-lg p-4">
              <h5 className="text-lg font-semibold text-red-800 mb-3 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Negative Team
              </h5>
              <div className="space-y-3">
                {negativeSpeakers.map((speaker) => (
                  <div key={speaker.id} className="bg-white rounded-lg p-3 mb-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">{speaker.name}</span>
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-yellow-500" />
                        <span className="font-semibold text-gray-900">{speaker.points}</span>
                      </div>
                    </div>
                    {speaker.feedback && (
                      <div className="mt-2 text-sm text-red-700 bg-red-50 rounded p-2">
                        <span className="font-semibold">Feedback:</span> {speaker.feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Debate Summary */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h5 className="text-lg font-semibold text-gray-900 mb-3">Debate Summary</h5>
            <p className="text-gray-700 leading-relaxed">{session.summary}</p>
          </div>

          {/* Session Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-900">
                {session.endTime ? formatDuration(session.startTime, session.endTime) : 'N/A'}
              </div>
              <div className="text-sm text-blue-700">Total Duration</div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-900">
                {session.speakers.length}
              </div>
              <div className="text-sm text-green-700">Speakers</div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <Award className="w-6 h-6 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-900">
                {session.points.length}
              </div>
              <div className="text-sm text-purple-700">Speeches Analyzed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Recommendations for Each Speaker */}
      {session.speakers.map((speaker) => (
        speaker.contentRecommendations && (
          <ContentRecommendations
            key={speaker.id}
            speakerName={speaker.name}
            weaknesses={speaker.contentRecommendations.weaknesses}
            recommendations={speaker.contentRecommendations.recommendations}
          />
        )
      ))}
    </div>
  );
};

export default FinalAnalysis; 