import React from 'react';
import { DebateSession } from '../types';
import { Trophy, Award, Users, Clock } from 'lucide-react';

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

  // Check if this is a practice session (no winner determined)
  const isPracticeSession = !session.winner;

  return (
    <div className="bg-white backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Final Analysis</h3>
        <p className="text-sm text-gray-600">Comprehensive debate analysis and feedback</p>
      </div>
      
      <div className="p-6 space-y-6">
        {/* Winner Section */}
        {session.winner && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">Winner</h4>
            <div className="flex items-center space-x-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                session.winner.team === 'affirmative' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {session.winner.team}
              </span>
              <span className="text-gray-600">wins the debate</span>
            </div>
            <p className="text-sm text-gray-700">{session.winner.reasoning}</p>
          </div>
        )}

        {/* Speaker Feedback */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Speaker Feedback</h4>
          {session.speakers.map((speaker) => (
            <div key={speaker.id} className="bg-gray-50 rounded-lg p-3 mb-2 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    speaker.team === 'affirmative' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {speaker.team}
                  </span>
                  <span className="font-medium text-gray-900">{speaker.name}</span>
                </div>
                <span className="text-sm text-gray-600">Points: {speaker.points}</span>
              </div>
              
              {speaker.feedback && typeof speaker.feedback === 'object' && 'strengths' in speaker.feedback && (
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Strengths:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {(speaker.feedback as any).strengths.map((strength: string, index: number) => (
                        <li key={index}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Areas for Improvement:</h5>
                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                      {(speaker.feedback as any).areasForImprovement.map((area: string, index: number) => (
                        <li key={index}>{area}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h5 className="text-sm font-medium text-gray-900 mb-1">Overall Assessment:</h5>
                    <p className="text-sm text-gray-700">{(speaker.feedback as any).overallAssessment}</p>
                  </div>
                  
                  {/* Delivery Metrics */}
                  {(speaker.feedback as any).delivery && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Delivery Metrics:</h5>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Clock className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-700">Speaking Pace</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {(speaker.feedback as any).delivery.wordsPerMinute} WPM
                          </p>
                          <p className="text-xs text-gray-600">
                            {(speaker.feedback as any).delivery.paceAssessment}
                          </p>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <Award className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-700">Filler Words</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {(speaker.feedback as any).delivery.fillerWords.count} words
                          </p>
                          <p className="text-xs text-gray-600">
                            ({(speaker.feedback as any).delivery.fillerWords.percentage.toFixed(1)}% of speech)
                          </p>
                          <p className="text-xs text-gray-600">
                            {(speaker.feedback as any).delivery.fillerAssessment}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {session.summary && (
          <div className="bg-gray-50 rounded p-2 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-1">Summary:</h4>
            <p className="text-sm text-gray-700">{session.summary}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinalAnalysis;