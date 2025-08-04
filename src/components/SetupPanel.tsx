import React, { useState, useEffect } from 'react';
import { Speaker } from '../types';
import { ArrowLeft } from 'lucide-react';
import RandomTopicSelector from './RandomTopicSelector';
import PrepTime from './PrepTime';

interface DebateFormat {
  name: string;
  description: string;
  peoplePerTeam: number;
  speechesPerSpeaker: number;
  firstSpeaker: 'affirmative' | 'negative';
  icon: string;
  prepTime: number; // in minutes
  prepTimeType: 'flexible' | 'pre-round'; // flexible = can use anytime, pre-round = before round starts
}

const DEBATE_FORMATS: DebateFormat[] = [
  {
    name: 'Public Forum',
    description: '2v2 format with constructive speeches and rebuttals',
    peoplePerTeam: 2,
    speechesPerSpeaker: 1,
    firstSpeaker: 'affirmative',
    icon: '🏛️',
    prepTime: 3,
    prepTimeType: 'flexible'
  },
  {
    name: 'Lincoln Douglas',
    description: '1v1 value debate format with multiple speeches per speaker',
    peoplePerTeam: 1,
    speechesPerSpeaker: 3,
    firstSpeaker: 'affirmative',
    icon: '⚖️',
    prepTime: 4,
    prepTimeType: 'flexible'
  },
  {
    name: 'Policy Debate',
    description: '2v2 format with constructives and rebuttals',
    peoplePerTeam: 2,
    speechesPerSpeaker: 2,
    firstSpeaker: 'affirmative',
    icon: '📋',
    prepTime: 8,
    prepTimeType: 'flexible'
  },
  {
    name: 'Parliamentary',
    description: '2v2 Government vs Opposition format',
    peoplePerTeam: 2,
    speechesPerSpeaker: 1,
    firstSpeaker: 'affirmative',
    icon: '🏛️',
    prepTime: 20,
    prepTimeType: 'pre-round'
  },
  {
    name: 'Spar Debate',
    description: '1v1 short format with quick constructive and rebuttal rounds',
    peoplePerTeam: 1,
    speechesPerSpeaker: 2,
    firstSpeaker: 'affirmative',
    icon: '⚡',
    prepTime: 2,
    prepTimeType: 'pre-round'
  }
];

interface SetupPanelProps {
  onInitialize: (topic: string, speakers: Speaker[], peoplePerTeam: number, speechesPerSpeaker: number, firstSpeaker: 'affirmative' | 'negative') => void;
  onBack?: () => void;
  selectedFormat?: DebateFormat;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const SetupPanel: React.FC<SetupPanelProps> = ({ onInitialize, onBack, selectedFormat: initialFormat, freeRoundsUsed = 0, isAdmin = false }) => {
  const [selectedFormat, setSelectedFormat] = useState<DebateFormat | null>(initialFormat || null);
  const [topic, setTopic] = useState('');
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);
  const [firstSpeaker, setFirstSpeaker] = useState<'affirmative' | 'negative'>('affirmative');
  const [speakerNames, setSpeakerNames] = useState<{ [key: string]: string }>({});
  const [judgingStyle, setJudgingStyle] = useState<'lay' | 'flow' | 'default'>('default');
  const [prepTime, setPrepTime] = useState(0);
  const [userTeam, setUserTeam] = useState<'affirmative' | 'negative'>('affirmative');
  const [userSpeakerNumber, setUserSpeakerNumber] = useState(1);

  // Initialize format from props
  useEffect(() => {
    if (initialFormat) {
      setSelectedFormat(initialFormat);
      setPeoplePerTeam(initialFormat.peoplePerTeam);
      setSpeechesPerSpeaker(initialFormat.speechesPerSpeaker);
      setFirstSpeaker(initialFormat.firstSpeaker);
      setPrepTime(initialFormat.prepTime);
    }
  }, [initialFormat]);

  const handleFormatSelect = (format: DebateFormat | null) => {
    setSelectedFormat(format);
    if (format) {
      setPeoplePerTeam(format.peoplePerTeam);
      setSpeechesPerSpeaker(format.speechesPerSpeaker);
      setFirstSpeaker(format.firstSpeaker);
      setPrepTime(format.prepTime);
    }
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

  // Setup Step
  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-4xl relative border border-blue-200/30">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center space-x-2 text-blue-700 hover:text-blue-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Mode Selection</span>
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">Debate Setup</h1>
          <p className="text-blue-700">
            {selectedFormat ? `Setting up ${selectedFormat.name} debate` : 'Setting up debate'}
          </p>
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
              format={selectedFormat?.name === 'Public Forum' ? 'publicForum' : 
                     selectedFormat?.name === 'Lincoln Douglas' ? 'lincolnDouglas' :
                     selectedFormat?.name === 'Policy Debate' ? 'policy' :
                     selectedFormat?.name === 'Parliamentary' ? 'parliamentary' :
                     selectedFormat?.name === 'Spar Debate' ? 'spar' : undefined}
              showRandomTopics={!selectedFormat || selectedFormat.name === 'Spar Debate' || selectedFormat.name === 'Parliamentary'}
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
          
          {/* First Speaker Selection - only show for Parliamentary and Public Forum formats */}
          {selectedFormat && (selectedFormat.name === 'Public Forum' || selectedFormat.name === 'Parliamentary') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Which Side Speaks First</label>
              <select
                value={firstSpeaker}
                onChange={e => setFirstSpeaker(e.target.value as 'affirmative' | 'negative')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="affirmative">Affirmative</option>
                <option value="negative">Negative</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Determines the speaking order</p>
            </div>
          )}
          
          {/* Side Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Which Side Are You On?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                userTeam === 'affirmative' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="team"
                  value="affirmative"
                  checked={userTeam === 'affirmative'}
                  onChange={() => setUserTeam('affirmative')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">✅</div>
                  <div className="font-medium text-blue-900">Affirmative</div>
                  <div className="text-xs text-blue-600">Supporting the resolution</div>
                </div>
              </label>
              
              <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                userTeam === 'negative' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="team"
                  value="negative"
                  checked={userTeam === 'negative'}
                  onChange={() => setUserTeam('negative')}
                  className="sr-only"
                />
                <div className="text-center">
                  <div className="text-2xl mb-2">❌</div>
                  <div className="font-medium text-blue-900">Negative</div>
                  <div className="text-xs text-blue-600">Opposing the resolution</div>
                </div>
              </label>
            </div>
          </div>

          {/* Speaker Number Selection - only for 2v2 formats */}
          {(selectedFormat && selectedFormat.peoplePerTeam === 2) || (!selectedFormat && peoplePerTeam === 2) ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Speaker Number on Your Team
              </label>
              <p className="text-sm text-gray-600 mb-3">
                Select which speaker position you want to practice as on your team.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  userSpeakerNumber === 1 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="speakerNumber"
                    value={1}
                    checked={userSpeakerNumber === 1}
                    onChange={(e) => setUserSpeakerNumber(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🥇</div>
                    <div className="font-medium text-blue-900">1st Speaker</div>
                    <div className="text-xs text-blue-600">Constructive speech</div>
                  </div>
                </label>
                
                <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  userSpeakerNumber === 2 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="speakerNumber"
                    value={2}
                    checked={userSpeakerNumber === 2}
                    onChange={(e) => setUserSpeakerNumber(parseInt(e.target.value))}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">🥈</div>
                    <div className="font-medium text-blue-900">2nd Speaker</div>
                    <div className="text-xs text-blue-600">Rebuttal speech</div>
                  </div>
                </label>
              </div>
            </div>
          ) : null}
          
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

          {/* Custom Format Configuration - show if no preset format selected */}
          {!selectedFormat && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2 flex items-center">
                <span className="mr-2">⚙️</span>
                Custom Format Configuration
              </h3>
              <p className="text-sm text-blue-700 mb-4">Configure your own debate format settings</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* People per Team */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    People per Team
                  </label>
                  <select
                    value={peoplePerTeam}
                    onChange={(e) => setPeoplePerTeam(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 (1v1)</option>
                    <option value={2}>2 (2v2)</option>
                    <option value={3}>3 (3v3)</option>
                    <option value={4}>4 (4v4)</option>
                  </select>
                </div>

                {/* Speeches per Speaker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Speeches per Speaker
                  </label>
                  <select
                    value={speechesPerSpeaker}
                    onChange={(e) => setSpeechesPerSpeaker(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 speech</option>
                    <option value={2}>2 speeches</option>
                    <option value={3}>3 speeches</option>
                    <option value={4}>4 speeches</option>
                  </select>
                </div>

                {/* Prep Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prep Time (minutes)
                  </label>
                  <select
                    value={prepTime}
                    onChange={(e) => setPrepTime(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={0}>No prep time</option>
                    <option value={2}>2 minutes</option>
                    <option value={3}>3 minutes</option>
                    <option value={4}>4 minutes</option>
                    <option value={5}>5 minutes</option>
                    <option value={8}>8 minutes</option>
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={20}>20 minutes</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Format Summary:</strong> {peoplePerTeam}v{peoplePerTeam} • {speechesPerSpeaker} speech{speechesPerSpeaker > 1 ? 'es' : ''} per speaker • {prepTime > 0 ? `${prepTime} min prep time` : 'No prep time'}
                </p>
              </div>
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
          
          {/* Prep Time Component */}
          {selectedFormat && selectedFormat.prepTimeType === 'flexible' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Prep Time</h3>
              <p className="text-sm text-blue-700 mb-4">
                This format includes {selectedFormat.prepTime} minutes of flexible prep time that can be used anytime during the debate.
              </p>
              <PrepTime
                totalPrepTime={selectedFormat.prepTime}
                prepTimeType={selectedFormat.prepTimeType}
                onPrepTimeUsed={(time) => console.log('Prep time used:', time)}
              />
            </div>
          )}
          
          {/* Prep Time Component for Custom Format */}
          {!selectedFormat && prepTime > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">Prep Time</h3>
              <p className="text-sm text-blue-700 mb-4">
                Your custom format includes {prepTime} minutes of prep time.
              </p>
              <PrepTime
                totalPrepTime={prepTime}
                prepTimeType="flexible"
                onPrepTimeUsed={(time) => console.log('Prep time used:', time)}
              />
            </div>
          )}
          
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