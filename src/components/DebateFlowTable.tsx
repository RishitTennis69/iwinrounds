import React from 'react';
import { DebateSession } from '../types';

interface DebateFlowTableProps {
  session: DebateSession;
  peoplePerTeam: number;
  speechesPerSpeaker: number;
}

const DebateFlowTable: React.FC<DebateFlowTableProps> = ({ session, peoplePerTeam, speechesPerSpeaker }) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const createDebateOrder = (speakers: any[], speeches: number, people: number): any[] => {
    const aff = speakers.filter(s => s.team === 'affirmative');
    const neg = speakers.filter(s => s.team === 'negative');
    const sequence: any[] = [];
    
    // Create sequence based on first speaker
    if (session.firstSpeaker === 'affirmative') {
      for (let i = 0; i < people; i++) {
        sequence.push(aff[i]);
        sequence.push(neg[i]);
      }
    } else {
      for (let i = 0; i < people; i++) {
        sequence.push(neg[i]);
        sequence.push(aff[i]);
      }
    }
    
    // Repeat the sequence for speeches per speaker
    const debateOrder: any[] = [];
    for (let i = 0; i < speeches; i++) {
      for (let j = 0; j < sequence.length; j++) {
        debateOrder.push(sequence[j]);
      }
    }
    return debateOrder;
  };

  const debateOrder = createDebateOrder(session.speakers, speechesPerSpeaker, peoplePerTeam);
  const speechColumns = Array.from({ length: peoplePerTeam * 2 * speechesPerSpeaker }, (_, i) => i + 1);

  return (
    <div className="bg-white backdrop-blur-sm rounded-lg shadow-md overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Debate Flow</h3>
        <p className="text-sm text-gray-600">Track arguments and responses throughout the debate</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Speaker
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Main Points
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Counter Points
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Counter-Counter Points
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact Weighing
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {session.points.map((point, index) => (
              <tr key={point.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-gray-50 border-r border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      point.team === 'affirmative' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {point.team}
                    </span>
                    <span className="font-medium">{point.speakerName}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Speech {point.speechNumber}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="space-y-2">
                    {point.mainPoints.map((mainPoint, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 rounded p-2 border border-gray-200">
                        {mainPoint}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="space-y-2">
                    {point.counterPoints.map((counterPoint, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 rounded p-2 border border-gray-200">
                        {counterPoint}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="space-y-2">
                    {point.counterCounterPoints.map((counterCounterPoint, idx) => (
                      <div key={idx} className="text-sm bg-gray-50 rounded p-2 border border-gray-200">
                        {counterCounterPoint}
                      </div>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-900">
                  <div className="text-sm bg-gray-50 rounded p-2 border border-gray-200">
                    {point.impactWeighing}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DebateFlowTable; 