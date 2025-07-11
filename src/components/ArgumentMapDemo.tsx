import React, { useState } from 'react';
import { ArgumentMap as ArgumentMapType } from '../types';
import ArgumentMap from './ArgumentMap';
import { Map, BarChart3, TrendingUp, Clock, Users, Play } from 'lucide-react';

const ArgumentMapDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'timeline'>('map');

  // Sample argument map data for demonstration
  const sampleArgumentMap: ArgumentMapType = {
    id: 'demo_map',
    sessionId: 'demo_session',
    nodes: [
      {
        id: 'claim_1',
        type: 'claim',
        content: 'We should ban fast food in schools',
        speakerId: 'speaker1',
        speakerName: 'Alice',
        team: 'affirmative',
        speechNumber: 1,
        timestamp: new Date(),
        strength: 8,
        childrenIds: ['evidence_1', 'evidence_2'],
        position: { x: 400, y: 100 }
      },
      {
        id: 'evidence_1',
        type: 'evidence',
        content: 'Studies show 60% of school lunches exceed calorie limits',
        speakerId: 'speaker1',
        speakerName: 'Alice',
        team: 'affirmative',
        speechNumber: 1,
        timestamp: new Date(),
        strength: 7,
        evidenceQuality: 8,
        parentId: 'claim_1',
        childrenIds: [],
        position: { x: 300, y: 250 }
      },
      {
        id: 'evidence_2',
        type: 'evidence',
        content: 'CDC reports link fast food to childhood obesity',
        speakerId: 'speaker1',
        speakerName: 'Alice',
        team: 'affirmative',
        speechNumber: 1,
        timestamp: new Date(),
        strength: 9,
        evidenceQuality: 9,
        parentId: 'claim_1',
        childrenIds: [],
        position: { x: 500, y: 250 }
      },
      {
        id: 'counter_1',
        type: 'counter-claim',
        content: 'Banning fast food won\'t solve the problem',
        speakerId: 'speaker2',
        speakerName: 'Bob',
        team: 'negative',
        speechNumber: 2,
        timestamp: new Date(),
        strength: 7,
        childrenIds: ['rebuttal_1'],
        position: { x: 800, y: 100 }
      },
      {
        id: 'rebuttal_1',
        type: 'rebuttal',
        content: 'Students will eat unhealthy food anyway',
        speakerId: 'speaker2',
        speakerName: 'Bob',
        team: 'negative',
        speechNumber: 2,
        timestamp: new Date(),
        strength: 6,
        logicalFallacies: ['Hasty generalization'],
        parentId: 'counter_1',
        childrenIds: [],
        position: { x: 700, y: 250 }
      },
      {
        id: 'reasoning_1',
        type: 'reasoning',
        content: 'Schools have responsibility for student health',
        speakerId: 'speaker1',
        speakerName: 'Alice',
        team: 'affirmative',
        speechNumber: 3,
        timestamp: new Date(),
        strength: 8,
        parentId: 'claim_1',
        childrenIds: [],
        position: { x: 400, y: 400 }
      }
    ],
    connections: [
      {
        id: 'conn_1',
        fromNodeId: 'evidence_1',
        toNodeId: 'claim_1',
        type: 'supports',
        strength: 8
      },
      {
        id: 'conn_2',
        fromNodeId: 'evidence_2',
        toNodeId: 'claim_1',
        type: 'supports',
        strength: 9
      },
      {
        id: 'conn_3',
        fromNodeId: 'counter_1',
        toNodeId: 'claim_1',
        type: 'counters',
        strength: 7
      },
      {
        id: 'conn_4',
        fromNodeId: 'rebuttal_1',
        toNodeId: 'counter_1',
        type: 'supports',
        strength: 6
      },
      {
        id: 'conn_5',
        fromNodeId: 'reasoning_1',
        toNodeId: 'claim_1',
        type: 'supports',
        strength: 8
      }
    ],
    lastUpdated: new Date()
  };

  const getTeamStats = () => {
    const teamStats = { affirmative: { nodes: 0, strength: 0 }, negative: { nodes: 0, strength: 0 } };
    
    sampleArgumentMap.nodes.forEach(node => {
      if (node.team === 'affirmative') {
        teamStats.affirmative.nodes++;
        teamStats.affirmative.strength += node.strength;
      } else {
        teamStats.negative.nodes++;
        teamStats.negative.strength += node.strength;
      }
    });

    if (teamStats.affirmative.nodes > 0) {
      teamStats.affirmative.strength = Math.round(teamStats.affirmative.strength / teamStats.affirmative.nodes);
    }
    if (teamStats.negative.nodes > 0) {
      teamStats.negative.strength = Math.round(teamStats.negative.strength / teamStats.negative.nodes);
    }

    return teamStats;
  };

  const getArgumentTypeStats = () => {
    const typeStats: { [key: string]: number } = {};
    sampleArgumentMap.nodes.forEach(node => {
      typeStats[node.type] = (typeStats[node.type] || 0) + 1;
    });
    return typeStats;
  };

  const getTimelineData = () => {
    return sampleArgumentMap.nodes
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(node => ({
        time: new Date(node.timestamp).toLocaleTimeString(),
        speaker: node.speakerName,
        team: node.team,
        type: node.type,
        strength: node.strength,
        content: node.content.substring(0, 50) + '...'
      }));
  };

  return (
    <div className="bg-white rounded-lg border">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Argument Map Demo</h2>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Play className="w-4 h-4" />
            Interactive Demo
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'map' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Map className="w-4 h-4" />
            Visual Map
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              activeTab === 'timeline' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'map' && (
          <div className="h-96">
            <ArgumentMap
              argumentMap={sampleArgumentMap}
              className="h-full"
            />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Team Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Affirmative Team
                </h3>
                {(() => {
                  const stats = getTeamStats();
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Arguments:</span>
                        <span className="font-medium">{stats.affirmative.nodes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Strength:</span>
                        <span className="font-medium">{stats.affirmative.strength}/10</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              <div className="bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Negative Team
                </h3>
                {(() => {
                  const stats = getTeamStats();
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Arguments:</span>
                        <span className="font-medium">{stats.negative.nodes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Strength:</span>
                        <span className="font-medium">{stats.negative.strength}/10</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Argument Types */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Argument Types Distribution</h3>
              {(() => {
                const typeStats = getArgumentTypeStats();
                return (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(typeStats).map(([type, count]) => (
                      <div key={type} className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{count}</div>
                        <div className="text-sm text-gray-600 capitalize">{type.replace('-', ' ')}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Strength Distribution */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Argument Strength Distribution
              </h3>
              {(() => {
                const strengthRanges = { '8-10': 0, '6-7': 0, '4-5': 0, '1-3': 0 };
                sampleArgumentMap.nodes.forEach(node => {
                  if (node.strength >= 8) strengthRanges['8-10']++;
                  else if (node.strength >= 6) strengthRanges['6-7']++;
                  else if (node.strength >= 4) strengthRanges['4-5']++;
                  else strengthRanges['1-3']++;
                });

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(strengthRanges).map(([range, count]) => (
                      <div key={range} className="text-center">
                        <div className="text-2xl font-bold text-green-600">{count}</div>
                        <div className="text-sm text-gray-600">{range} strength</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h3 className="font-semibold mb-3">Argument Timeline</h3>
            {(() => {
              const timelineData = getTimelineData();
              return (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {timelineData.map((item, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 min-w-[60px]">{item.time}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{item.speaker}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            item.team === 'affirmative' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.team}
                          </span>
                          <span className="text-xs text-gray-500 capitalize">{item.type}</span>
                        </div>
                        <div className="text-sm text-gray-700">{item.content}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">Strength:</span>
                          <span className="text-xs font-medium">{item.strength}/10</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArgumentMapDemo; 