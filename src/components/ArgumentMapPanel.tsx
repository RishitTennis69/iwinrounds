import React, { useState, useEffect } from 'react';
import { ArgumentMap as ArgumentMapType, ArgumentNode, DebateSession } from '../types';
import { AIService } from '../utils/aiService';
import ArgumentMap from './ArgumentMap';
import { Map, BarChart3, Clock, Users } from 'lucide-react';

interface ArgumentMapPanelProps {
  session: DebateSession;
  onClose?: () => void;
  className?: string;
}

const ArgumentMapPanel: React.FC<ArgumentMapPanelProps> = ({ session, onClose, className = '' }) => {
  const [argumentMap, setArgumentMap] = useState<ArgumentMapType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'map' | 'analytics' | 'timeline'>('map');

  // Initialize argument map when session changes
  useEffect(() => {
    if (session && session.points.length > 0) {
      initializeArgumentMap();
    }
  }, [session]);

  const initializeArgumentMap = async () => {
    if (!session.argumentMap) {
      setIsLoading(true);
      try {
        const newArgumentMap: ArgumentMapType = {
          id: `map_${session.id}`,
          sessionId: session.id,
          nodes: [],
          connections: [],
          lastUpdated: new Date()
        };

        // Process each speech to extract argument nodes
        for (const point of session.points) {
          try {
            const { nodes, connections } = await AIService.extractArgumentNodes(
              point.transcript,
              point.speakerId,
              point.speakerName,
              point.team,
              point.speechNumber
            );

            // Add fallacy detection for each node
            const nodesWithFallacies = await Promise.all(
              nodes.map(async (node) => {
                const fallacyAnalysis = await AIService.detectLogicalFallacies(node.content);
                return {
                  ...node,
                  logicalFallacies: fallacyAnalysis.fallacies.map(f => f.type),
                  strength: fallacyAnalysis.overallStrength
                };
              })
            );

            newArgumentMap.nodes.push(...nodesWithFallacies);
            newArgumentMap.connections.push(...connections);
          } catch (error) {
            console.error('Error processing speech for argument mapping:', error);
          }
        }

        setArgumentMap(newArgumentMap);
      } catch (error) {
        console.error('Error initializing argument map:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setArgumentMap(session.argumentMap);
    }
  };

  // Remove strength from team stats
  const getTeamStats = () => {
    if (!argumentMap) return { affirmative: { nodes: 0 }, negative: { nodes: 0 } };
    const teamStats = { affirmative: { nodes: 0 }, negative: { nodes: 0 } };
    argumentMap.nodes.forEach(node => {
      if (node.team === 'affirmative') {
        teamStats.affirmative.nodes++;
      } else {
        teamStats.negative.nodes++;
      }
    });
    return teamStats;
  };

  const getArgumentTypeStats = () => {
    if (!argumentMap) return {};

    const typeStats: { [key: string]: number } = {};
    argumentMap.nodes.forEach(node => {
      typeStats[node.type] = (typeStats[node.type] || 0) + 1;
    });

    return typeStats;
  };

  // Remove strength from timeline data
  const getTimelineData = () => {
    if (!argumentMap) return [];
    return argumentMap.nodes
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map(node => ({
        time: new Date(node.timestamp).toLocaleTimeString(),
        speaker: node.speakerName,
        team: node.team,
        type: node.type,
        content: node.content.substring(0, 50) + '...'
      }));
  };

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Building argument map...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!argumentMap) {
    return (
      <div className={`bg-white rounded-lg border p-6 ${className}`}>
        <div className="text-center text-gray-600">
          <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>No argument data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Argument Map</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          )}
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
              argumentMap={argumentMap}
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
            {/* Remove strength distribution section */}
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

export default ArgumentMapPanel; 