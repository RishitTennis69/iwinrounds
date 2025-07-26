import React, { useState } from 'react';
import { Speaker } from '../types';
import { ArrowLeft } from 'lucide-react';
import RandomTopicSelector from './RandomTopicSelector';

interface SetupPanelProps {
  onInitialize: (topic: string, speakers: Speaker[], peoplePerTeam: number, speechesPerSpeaker: number, firstSpeaker: 'affirmative' | 'negative') => void;
  onBack?: () => void;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const SetupPanel: React.FC<SetupPanelProps> = ({ onInitialize, onBack, freeRoundsUsed = 0, isAdmin = false }) => {
  const [topic, setTopic] = useState('');
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);
  const [firstSpeaker, setFirstSpeaker] = useState<'affirmative' | 'negative'>('affirmative');
  const [speakerNames, setSpeakerNames] = useState<{ [key: string]: string }>({});

  // Generate speaker keys
  const getSpeakerKey = (team: 'affirmative' | 'negative', idx: number) => `${team}${idx+1}`;

  // Generate speaker input fields
  const speakerInputs = (team: 'affirmative' | 'negative') => {
    return Array.from({ length: peoplePerTeam }).map((_, idx) => {
      const key = getSpeakerKey(team, idx);
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {`${idx+1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} ${team.charAt(0).toUpperCase() + team.slice(1)} Speaker Name`}
          </label>
          <input
            type="text"
            value={speakerNames[key] || ''}
            onChange={e => setSpeakerNames({ ...speakerNames, [key]: e.target.value })}
            className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-${team === 'affirmative' ? 'blue' : 'red'}-500 focus:border-transparent`}
            placeholder={`Enter ${idx+1}${idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} ${team.charAt(0).toUpperCase() + team.slice(1)} speaker's name`}
            required
          />
          {speakerNames[key] && (
            <p className={`text-sm mt-1 text-${team === 'affirmative' ? 'blue' : 'red'}-600`}>
              ✓ {idx+1}{idx === 0 ? 'st' : idx === 1 ? 'nd' : idx === 2 ? 'rd' : 'th'} {team.charAt(0).toUpperCase() + team.slice(1)}: {speakerNames[key]}
            </p>
          )}
        </div>
      );
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Validate all fields
    if (!topic) {
      alert('Please fill in all fields');
      return;
    }
    for (let i = 0; i < peoplePerTeam; i++) {
      if (!speakerNames[getSpeakerKey('affirmative', i)] || !speakerNames[getSpeakerKey('negative', i)]) {
        alert('Please fill in all speaker names');
        return;
      }
    }
    // Create speakers array
    const speakers: Speaker[] = [];
    for (let i = 0; i < peoplePerTeam; i++) {
      speakers.push({
        id: `aff${i+1}`,
        name: speakerNames[getSpeakerKey('affirmative', i)],
        team: 'affirmative',
        points: 0,
        speakerNumber: i+1
      });
      speakers.push({
        id: `neg${i+1}`,
        name: speakerNames[getSpeakerKey('negative', i)],
        team: 'negative',
        points: 0,
        speakerNumber: i+1
      });
    }
    onInitialize(topic, speakers, peoplePerTeam, speechesPerSpeaker, firstSpeaker);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Mode Selection</span>
          </button>
        )}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">ReasynAI</h1>
          <p className="text-gray-600">Your Personal AI Coach That Fits in Your Pocket</p>
          <p className="text-blue-600 font-medium mt-2">Debate Mode Setup</p>
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
            
            {/* Random Topic Selector */}
            <RandomTopicSelector 
              onTopicSelect={setTopic}
              currentTopic={topic}
            />
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or enter your own topic</span>
              </div>
            </div>
            
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
              placeholder="Enter the debate topic or resolution..."
              required
            />
          </div>
          {/* Customization fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of People per Team</label>
              <input
                type="number"
                min={1}
                max={6}
                value={peoplePerTeam}
                onChange={e => setPeoplePerTeam(Math.max(1, Math.min(6, Number(e.target.value))))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Number of Speeches per Speaker</label>
              <input
                type="number"
                min={1}
                max={8}
                value={speechesPerSpeaker}
                onChange={e => setSpeechesPerSpeaker(Math.max(1, Math.min(8, Number(e.target.value))))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Which Side Speaks First</label>
              <select
                value={firstSpeaker}
                onChange={e => setFirstSpeaker(e.target.value as 'affirmative' | 'negative')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="affirmative">Affirmative</option>
                <option value="negative">Negative</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Determines the speaking order</p>
            </div>
          </div>
          {/* Speakers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">Affirmative Team</h3>
              <p className="text-sm text-gray-600 mb-3">Enter names for each speaker position</p>
              {speakerInputs('affirmative')}
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">Negative Team</h3>
              <p className="text-sm text-gray-600 mb-3">Enter names for each speaker position</p>
              {speakerInputs('negative')}
            </div>
          </div>
          {/* Debate Order Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Debate Order & Speaker Numbers</h3>
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Total Speakers:</strong> {peoplePerTeam * 2} ({peoplePerTeam} per team)
              </p>
              <p className="text-sm text-gray-600">
                <strong>Speaking Order:</strong> {firstSpeaker.charAt(0).toUpperCase() + firstSpeaker.slice(1)} team speaks first
              </p>
            </div>
            <div className="grid grid-cols-{peoplePerTeam * 2} gap-2 text-sm">
              {Array.from({ length: peoplePerTeam * 2 }).map((_, idx) => {
                // Determine team based on first speaker
                let team: 'affirmative' | 'negative';
                if (firstSpeaker === 'affirmative') {
                  team = idx % 2 === 0 ? 'affirmative' : 'negative';
                } else {
                  team = idx % 2 === 0 ? 'negative' : 'affirmative';
                }
                const speakerIdx = Math.floor(idx / 2);
                const key = getSpeakerKey(team, speakerIdx);
                const speakerNumber = idx + 1; // Global speaker number
                const isFirstSpeaker = idx === 0;
                return (
                  <div className="text-center" key={key}>
                    <div className={`font-medium text-${team === 'affirmative' ? 'blue' : 'red'}-600`}>
                      Speaker #{speakerNumber}
                      {isFirstSpeaker && (
                        <div className="text-xs text-green-600 font-bold mt-1">FIRST</div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {speakerIdx+1}{speakerIdx === 0 ? 'st' : speakerIdx === 1 ? 'nd' : speakerIdx === 2 ? 'rd' : 'th'} {team.charAt(0).toUpperCase() + team.slice(1)}
                    </div>
                    <div className="text-gray-600 text-xs">{speakerNames[key] || `Speaker ${speakerNumber}`}</div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-gray-500 mt-2 text-center">
              This order repeats for a total of {peoplePerTeam * 2 * speechesPerSpeaker} speeches
            </div>
            <div className="text-xs text-green-600 mt-2 text-center font-medium">
              {firstSpeaker.charAt(0).toUpperCase() + firstSpeaker.slice(1)} team speaks first
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