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
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            {isPracticeSession ? (
              <>
                <Award className="w-5 h-5 mr-2 text-blue-500" />
                Practice Session Complete
              </>
            ) : (
              <>
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Final Analysis
              </>
            )}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          {/* Winner Section - Only show for competitive debates */}
          {!isPracticeSession && session.winner && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="space-y-4">
                {/* Winner */}
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">
                      Winner: {session.winner?.team === 'affirmative' ? 'Affirmative Team' : 'Negative Team'}
                    </h4>
                  </div>
                  <div className={`text-6xl ${session.winner?.team === 'affirmative' ? 'text-green-500' : 'text-red-500'}`}>
                    🏆
                  </div>
                </div>
                
                {/* Key Arguments */}
                {session.winner?.keyArguments && (
                  <div>
                    <h5 className="text-lg font-semibold text-gray-800 mb-2">Key Arguments:</h5>
                    <p className="text-gray-700 leading-relaxed">{session.winner.keyArguments}</p>
                  </div>
                )}
                
                {/* Clash */}
                {session.winner?.clash && (
                  <div>
                    <h5 className="text-lg font-semibold text-gray-800 mb-2">Clash:</h5>
                    <p className="text-gray-700 leading-relaxed">{session.winner.clash}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Practice Session Summary */}
          {isPracticeSession && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-semibold text-gray-900">
                  Practice Session Summary
                </h4>
                <div className="text-6xl text-blue-500">
                  🎯
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Great job completing your practice session! Review your personalized feedback below to identify areas for improvement and continue developing your debate skills.
              </p>
            </div>
          )}

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
                      {!isPracticeSession && (
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-900">{speaker.points}</span>
                        </div>
                      )}
                    </div>
                    {speaker.feedback && (
                      <div className="mt-3 space-y-3">
                        {/* Handle old string format */}
                        {typeof speaker.feedback === 'string' && (
                          <div className="text-sm text-blue-700 bg-blue-50 rounded p-2">
                            <span className="font-semibold">Feedback:</span> {speaker.feedback}
                          </div>
                        )}
                        
                        {/* Handle new structured format */}
                        {typeof speaker.feedback === 'object' && speaker.feedback && (
                          <>
                            {/* Strengths */}
                            {speaker.feedback.strengths && speaker.feedback.strengths.length > 0 && (
                              <div className="text-sm">
                                <div className="font-semibold text-green-700 mb-1 flex items-center">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                  Strengths:
                                </div>
                                <ul className="list-disc list-inside text-green-600 space-y-1 ml-4">
                                  {speaker.feedback.strengths.map((strength, index) => (
                                    <li key={index} className="text-xs">{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Areas for Improvement */}
                            {speaker.feedback.areasForImprovement && speaker.feedback.areasForImprovement.length > 0 && (
                              <div className="text-sm">
                                <div className="font-semibold text-orange-700 mb-1 flex items-center">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  Areas for Improvement:
                                </div>
                                <ul className="list-disc list-inside text-orange-600 space-y-1 ml-4">
                                  {speaker.feedback.areasForImprovement.map((area, index) => (
                                    <li key={index} className="text-xs">{area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Overall Assessment */}
                            {speaker.feedback.overallAssessment && (
                              <div className="text-sm bg-gray-50 rounded p-2">
                                <div className="font-semibold text-gray-700 mb-1">Overall Assessment:</div>
                                <p className="text-gray-600 text-xs">{speaker.feedback.overallAssessment}</p>
                              </div>
                            )}
                          </>
                        )}
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
                      {!isPracticeSession && (
                        <div className="flex items-center space-x-2">
                          <Award className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-900">{speaker.points}</span>
                        </div>
                      )}
                    </div>
                    {speaker.feedback && (
                      <div className="mt-3 space-y-3">
                        {/* Handle old string format */}
                        {typeof speaker.feedback === 'string' && (
                          <div className="text-sm text-red-700 bg-red-50 rounded p-2">
                            <span className="font-semibold">Feedback:</span> {speaker.feedback}
                          </div>
                        )}
                        
                        {/* Handle new structured format */}
                        {typeof speaker.feedback === 'object' && speaker.feedback && (
                          <>
                            {/* Strengths */}
                            {speaker.feedback.strengths && speaker.feedback.strengths.length > 0 && (
                              <div className="text-sm">
                                <div className="font-semibold text-green-700 mb-1 flex items-center">
                                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                  Strengths:
                                </div>
                                <ul className="list-disc list-inside text-green-600 space-y-1 ml-4">
                                  {speaker.feedback.strengths.map((strength, index) => (
                                    <li key={index} className="text-xs">{strength}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Areas for Improvement */}
                            {speaker.feedback.areasForImprovement && speaker.feedback.areasForImprovement.length > 0 && (
                              <div className="text-sm">
                                <div className="font-semibold text-orange-700 mb-1 flex items-center">
                                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                                  Areas for Improvement:
                                </div>
                                <ul className="list-disc list-inside text-orange-600 space-y-1 ml-4">
                                  {speaker.feedback.areasForImprovement.map((area, index) => (
                                    <li key={index} className="text-xs">{area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {/* Overall Assessment */}
                            {speaker.feedback.overallAssessment && (
                              <div className="text-sm bg-gray-50 rounded p-2">
                                <div className="font-semibold text-gray-700 mb-1">Overall Assessment:</div>
                                <p className="text-gray-600 text-xs">{speaker.feedback.overallAssessment}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Debate Summary */}
          {session.summary && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-3">
                {isPracticeSession ? 'Session Summary' : 'Debate Summary'}
              </h5>
              <p className="text-gray-700 leading-relaxed">{session.summary}</p>
            </div>
          )}

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
    </div>
  );
};

export default FinalAnalysis; 