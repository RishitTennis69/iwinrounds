import React, { useState } from 'react';
import { DebateSession, Speaker } from '../types';

interface SetupPanelProps {
  onInitialize: (topic: string, speakers: Speaker[]) => void;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const SetupPanel: React.FC<SetupPanelProps> = ({ onInitialize, freeRoundsUsed = 0, isAdmin = false }) => {
  const [topic, setTopic] = useState('');
  const [speakerNames, setSpeakerNames] = useState({
    affirmative1: '',
    affirmative2: '',
    negative1: '',
    negative2: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic || 
        !speakerNames.affirmative1 || !speakerNames.affirmative2 || 
        !speakerNames.negative1 || !speakerNames.negative2) {
      alert('Please fill in all fields');
      return;
    }

    // Create speakers array in the correct format
    const speakers: Speaker[] = [
      {
        id: 'aff1',
        name: speakerNames.affirmative1,
        team: 'affirmative',
        points: 0
      },
      {
        id: 'aff2',
        name: speakerNames.affirmative2,
        team: 'affirmative',
        points: 0
      },
      {
        id: 'neg1',
        name: speakerNames.negative1,
        team: 'negative',
        points: 0
      },
      {
        id: 'neg2',
        name: speakerNames.negative2,
        team: 'negative',
        points: 0
      }
    ];

    onInitialize(topic, speakers);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">DebateFlowy</h1>
          <p className="text-gray-600">AI-Powered Debate Analysis & Flow Tracking</p>
          
          {/* Free Rounds Status */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            {isAdmin ? (
              <div className="text-green-600 font-medium">
                ✓ Admin Access - Unlimited Rounds
              </div>
            ) : (
              <div className="text-gray-700">
                <span className="font-medium">Free Rounds:</span> {freeRoundsUsed}/1 used
                {freeRoundsUsed >= 1 && (
                  <div className="text-red-600 text-sm mt-1">
                    Admin password required for additional rounds
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Debate Topic
            </label>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter the debate topic or resolution..."
              required
            />
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Affirmative Team Name
              </label>
              <input
                type="text"
                value={speakerNames.affirmative1}
                onChange={(e) => setSpeakerNames({...speakerNames, affirmative1: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Team Alpha"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Negative Team Name
              </label>
              <input
                type="text"
                value={speakerNames.negative1}
                onChange={(e) => setSpeakerNames({...speakerNames, negative1: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="e.g., Team Beta"
                required
              />
            </div>
          </div>

          {/* Speakers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Affirmative Speakers</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1st Speaker
                </label>
                <input
                  type="text"
                  value={speakerNames.affirmative1}
                  onChange={(e) => setSpeakerNames({...speakerNames, affirmative1: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Speaker name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2nd Speaker
                </label>
                <input
                  type="text"
                  value={speakerNames.affirmative2}
                  onChange={(e) => setSpeakerNames({...speakerNames, affirmative2: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Speaker name"
                  required
                />
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Negative Speakers</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  1st Speaker
                </label>
                <input
                  type="text"
                  value={speakerNames.negative1}
                  onChange={(e) => setSpeakerNames({...speakerNames, negative1: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Speaker name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  2nd Speaker
                </label>
                <input
                  type="text"
                  value={speakerNames.negative2}
                  onChange={(e) => setSpeakerNames({...speakerNames, negative2: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Speaker name"
                  required
                />
              </div>
            </div>
          </div>

          {/* Debate Order Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Debate Order</h3>
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="text-center">
                <div className="font-medium text-blue-600">1st Aff</div>
                <div className="text-gray-600">{speakerNames.affirmative1 || 'Speaker 1'}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">1st Neg</div>
                <div className="text-gray-600">{speakerNames.negative1 || 'Speaker 1'}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-blue-600">2nd Aff</div>
                <div className="text-gray-600">{speakerNames.affirmative2 || 'Speaker 2'}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-red-600">2nd Neg</div>
                <div className="text-gray-600">{speakerNames.negative2 || 'Speaker 2'}</div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              This order repeats twice for a total of 8 speeches
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
          >
            Start Debate
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupPanel; 