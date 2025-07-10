import React from 'react';
import { DebateSession } from '../types';

interface DebateFlowTableProps {
  session: DebateSession;
  peoplePerTeam: number;
  speechesPerSpeaker: number;
}

const DebateFlowTable: React.FC<DebateFlowTableProps> = ({ session, peoplePerTeam, speechesPerSpeaker }) => {
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Create debate order that matches the App.tsx logic
  const createDebateOrder = (speakers: any[], speeches: number, people: number): any[] => {
    const aff = speakers.filter(s => s.team === 'affirmative');
    const neg = speakers.filter(s => s.team === 'negative');
    const sequence: any[] = [];
    for (let i = 0; i < people; i++) {
      sequence.push(aff[i]);
      sequence.push(neg[i]);
    }
    const debateOrder: any[] = [];
    for (let i = 0; i < speeches; i++) {
      for (let j = 0; j < sequence.length; j++) {
        debateOrder.push(sequence[j]);
      }
    }
    return debateOrder;
  };

  // Create columns for each speech
  const totalSpeeches = peoplePerTeam * 2 * speechesPerSpeaker;
  const speechColumns = Array.from({ length: totalSpeeches }, (_, i) => i + 1);
  const debateOrder = createDebateOrder(session.speakers, speechesPerSpeaker, peoplePerTeam);

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Debate Flow Analysis
        </h3>
        <p className="text-sm text-gray-600">
          AI-generated analysis of each speech - follow the debate flow horizontally
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                Analysis Type
              </th>
              {speechColumns.map((speechNum) => {
                const speech = session.points.find(p => p.speechNumber === speechNum);
                const expectedSpeaker = debateOrder[speechNum - 1];
                const speaker = speech || expectedSpeaker;
                return (
                  <th key={speechNum} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">
                    <div className="space-y-1">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        speaker?.team === 'affirmative' 
                          ? 'bg-green-100 text-green-800' 
                          : speaker?.team === 'negative'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        Speech {speechNum}
                      </div>
                      <div className="text-xs font-medium text-gray-900">
                        {speaker?.name || 'Unknown Speaker'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {speaker?.team || 'Unknown Team'}
                      </div>
                      {speech && (
                        <div className="text-xs text-gray-400">
                          {formatTime(speech.timestamp)}
                        </div>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Main Points Row */}
            <tr>
              <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-blue-50 border-r border-gray-200">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                  Main Points
                </div>
              </td>
              {speechColumns.map((speechNum) => {
                const speech = session.points.find(p => p.speechNumber === speechNum);
                return (
                  <td key={speechNum} className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 align-top">
                    {speech ? (
                      <div className="space-y-2">
                        {speech.mainPoints.map((point: string, index: number) => (
                          <div key={index} className="text-sm bg-blue-50 rounded p-2">
                            {point}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">
                        Not recorded yet
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            {/* Counter Points Row */}
            <tr>
              <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-orange-50 border-r border-gray-200">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                  Counter Points
                </div>
              </td>
              {speechColumns.map((speechNum) => {
                const speech = session.points.find(p => p.speechNumber === speechNum);
                return (
                  <td key={speechNum} className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 align-top">
                    {speech ? (
                      <div className="space-y-2">
                        {speech.counterPoints.map((point: string, index: number) => (
                          <div key={index} className="text-sm bg-orange-50 rounded p-2">
                            {point}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">
                        Not recorded yet
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            {/* Counter-Counter Points Row */}
            <tr>
              <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-purple-50 border-r border-gray-200">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                  Counter-Counter Points
                </div>
              </td>
              {speechColumns.map((speechNum) => {
                const speech = session.points.find(p => p.speechNumber === speechNum);
                return (
                  <td key={speechNum} className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 align-top">
                    {speech ? (
                      <div className="space-y-2">
                        {speech.counterCounterPoints.map((point: string, index: number) => (
                          <div key={index} className="text-sm bg-purple-50 rounded p-2">
                            {point}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">
                        Not recorded yet
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
            {/* Impact Weighing Row */}
            <tr>
              <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-yellow-50 border-r border-gray-200">
                <div className="flex items-center">
                  <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                  Impact Weighing
                </div>
              </td>
              {speechColumns.map((speechNum) => {
                const speech = session.points.find(p => p.speechNumber === speechNum);
                return (
                  <td key={speechNum} className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 align-top">
                    {speech ? (
                      <div className="text-sm bg-yellow-50 rounded p-2">
                        {speech.impactWeighing}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm italic">
                        Not recorded yet
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebateFlowTable; 