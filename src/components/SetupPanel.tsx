import React, { useState } from 'react';
import { Speaker } from '../types';
import { ArrowLeft } from 'lucide-react';
import RandomTopicSelector from './RandomTopicSelector';

interface DebateFormat {
  name: string;
  description: string;
  peoplePerTeam: number;
  speechesPerSpeaker: number;
  firstSpeaker: 'affirmative' | 'negative';
  icon: string;
}

const DEBATE_FORMATS: DebateFormat[] = [
  {
    name: 'Public Forum',
    description: '2v2 format with constructive speeches and rebuttals',
    peoplePerTeam: 2,
    speechesPerSpeaker: 1,
    firstSpeaker: 'affirmative',
    icon: '🏛️'
  },
  {
    name: 'Lincoln Douglas',
    description: '1v1 value debate format with multiple speeches per speaker',
    peoplePerTeam: 1,
    speechesPerSpeaker: 3,
    firstSpeaker: 'affirmative',
    icon: '⚖️'
  },
  {
    name: 'Policy Debate',
    description: '2v2 format with constructives and rebuttals',
    peoplePerTeam: 2,
    speechesPerSpeaker: 2,
    firstSpeaker: 'affirmative',
    icon: '📋'
  },
  {
    name: 'Parliamentary',
    description: '2v2 Government vs Opposition format',
    peoplePerTeam: 2,
    speechesPerSpeaker: 1,
    firstSpeaker: 'affirmative',
    icon: '🏛️'
  }
];

interface SetupPanelProps {
  onInitialize: (topic: string, speakers: Speaker[], peoplePerTeam: number, speechesPerSpeaker: number, firstSpeaker: 'affirmative' | 'negative') => void;
  onBack?: () => void;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const SetupPanel: React.FC<SetupPanelProps> = ({ onInitialize, onBack, freeRoundsUsed = 0, isAdmin = false }) => {
  const [step, setStep] = useState<'format' | 'setup'>('format');
  const [selectedFormat, setSelectedFormat] = useState<DebateFormat | null>(null);
  const [topic, setTopic] = useState('');
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);
  const [firstSpeaker, setFirstSpeaker] = useState<'affirmative' | 'negative'>('affirmative');
  const [speakerNames, setSpeakerNames] = useState<{ [key: string]: string }>({});
  const [judgingStyle, setJudgingStyle] = useState<'lay' | 'flow' | 'default'>('default');

  const handleFormatSelect = (format: DebateFormat | null) => {
    setSelectedFormat(format);
    if (format) {
      setPeoplePerTeam(format.peoplePerTeam);
      setSpeechesPerSpeaker(format.speechesPerSpeaker);
      setFirstSpeaker(format.firstSpeaker);
    }
    setStep('setup');
  };

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

  // Format Selection Step
  if (step === 'format') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl relative">
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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">Choose Debate Format</h1>
            <p className="text-gray-600">Select a standard format or customize your own settings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Standard Formats */}
            {DEBATE_FORMATS.map((format) => (
              <button
                key={format.name}
                onClick={() => handleFormatSelect(format)}
                className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="text-4xl mb-4">{format.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                  {format.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">{format.description}</p>
                <div className="space-y-1 text-xs text-gray-500">
                  <div>👥 {format.peoplePerTeam === 1 ? '1v1' : `${format.peoplePerTeam}v${format.peoplePerTeam}`}</div>
                  <div>🎤 {format.speechesPerSpeaker} speech{format.speechesPerSpeaker > 1 ? 'es' : ''} per speaker</div>
                  <div>🥇 {format.firstSpeaker === 'affirmative' ? 'Aff' : 'Neg'} speaks first</div>
                </div>
              </button>
            ))}

            {/* Custom Format Option */}
            <button
              onClick={() => handleFormatSelect(null)}
              className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-purple-600">
                Custom Format
              </h3>
              <p className="text-gray-600 text-sm mb-4">
                Configure your own debate format with custom settings
              </p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>👥 Choose team size</div>
                <div>🎤 Set speeches per speaker</div>
                <div>🥇 Pick speaking order</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup Step (existing setup form)
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
        {/* Back Button */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setStep('format')}
            className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Format Selection</span>
          </button>
          {onBack && (
            <button
              onClick={onBack}
              className="absolute top-6 right-6 text-gray-600 hover:text-gray-800 transition-colors text-sm"
            >
              Exit Setup
            </button>
          )}
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">ReasynAI</h1>
          <p className="text-gray-600">Your Personal AI Coach That Fits in Your Pocket</p>
          <p className="text-blue-600 font-medium mt-2">
            {selectedFormat ? `${selectedFormat.name} Setup` : 'Custom Format Setup'}
          </p>
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
          
          {/* Customization fields - only show if custom format */}
          {!selectedFormat && (
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
          )}
          
          {/* Judging Style Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Judging Style
            </label>
            <p className="text-sm text-gray-600 mb-3">
              Choose how the AI will evaluate speeches and determine the winner
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                judgingStyle === 'lay' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="judgingStyle"
                  value="lay"
                  checked={judgingStyle === 'lay'}
                  onChange={(e) => setJudgingStyle(e.target.value as 'lay' | 'flow' | 'default')}
                  className="sr-only"
                />
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                    judgingStyle === 'lay' 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {judgingStyle === 'lay' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Lay Judge</span>
                </div>
                <p className="text-xs text-gray-600">
                  Focuses on clarity, pace, and persuasiveness. Penalizes excessive speed and filler words more heavily.
                </p>
              </label>
              
              <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                judgingStyle === 'flow' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="judgingStyle"
                  value="flow"
                  checked={judgingStyle === 'flow'}
                  onChange={(e) => setJudgingStyle(e.target.value as 'lay' | 'flow' | 'default')}
                  className="sr-only"
                />
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                    judgingStyle === 'flow' 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {judgingStyle === 'flow' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Flow Judge</span>
                </div>
                <p className="text-xs text-gray-600">
                  Technical judging focused on argument quality and clash. Speed and delivery matter less.
                </p>
              </label>
              
              <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                judgingStyle === 'default' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="judgingStyle"
                  value="default"
                  checked={judgingStyle === 'default'}
                  onChange={(e) => setJudgingStyle(e.target.value as 'lay' | 'flow' | 'default')}
                  className="sr-only"
                />
                <div className="flex items-center mb-2">
                  <div className={`w-4 h-4 rounded-full border-2 mr-2 ${
                    judgingStyle === 'default' 
                      ? 'border-blue-600 bg-blue-600' 
                      : 'border-gray-300'
                  }`}>
                    {judgingStyle === 'default' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                  <span className="font-medium text-gray-900">Default Judge</span>
                </div>
                <p className="text-xs text-gray-600">
                  Balanced approach considering both argument quality and delivery style.
                </p>
              </label>
            </div>
          </div>
          
          {/* Format Summary - show if preset format selected */}
          {selectedFormat && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                <span className="mr-2">{selectedFormat.icon}</span>
                {selectedFormat.name} Format
              </h3>
              <p className="text-sm text-blue-700 mb-2">{selectedFormat.description}</p>
              <p className="text-xs text-blue-600">👥 {selectedFormat.peoplePerTeam === 1 ? '1v1' : `${selectedFormat.peoplePerTeam}v${selectedFormat.peoplePerTeam}`} • 🎤 {selectedFormat.speechesPerSpeaker} speech{selectedFormat.speechesPerSpeaker > 1 ? 'es' : ''} per speaker • 🥇 {selectedFormat.firstSpeaker === 'affirmative' ? 'Affirmative' : 'Negative'} speaks first</p>
              <p className="text-xs text-blue-600 mt-1">⚖️ {judgingStyle.charAt(0).toUpperCase() + judgingStyle.slice(1)} judging style</p>
            </div>
          )}
          
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