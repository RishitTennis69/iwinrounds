import React, { useState } from 'react';
import { Map } from 'lucide-react';
import { HeroSection } from './ui/spline-demo';

interface ModeSelectionProps {
  onSelectMode: (mode: 'debate' | 'practice', format?: any) => void;
  onBack?: () => void;
}

const DEBATE_FORMATS = [
  {
    name: 'Public Forum',
    description: '2v2 format with constructive speeches and rebuttals',
    peoplePerTeam: 2,
    speechesPerSpeaker: 1,
    firstSpeaker: 'affirmative' as const,
    icon: '🏛️',
    prepTime: 3,
    prepTimeType: 'flexible' as const
  },
  {
    name: 'Lincoln Douglas',
    description: '1v1 value debate format with multiple speeches per speaker',
    peoplePerTeam: 1,
    speechesPerSpeaker: 3,
    firstSpeaker: 'affirmative' as const,
    icon: '⚖️',
    prepTime: 4,
    prepTimeType: 'flexible' as const
  },
  {
    name: 'Policy Debate',
    description: '2v2 format with constructives and rebuttals',
    peoplePerTeam: 2,
    speechesPerSpeaker: 2,
    firstSpeaker: 'affirmative' as const,
    icon: '📋',
    prepTime: 8,
    prepTimeType: 'flexible' as const
  },
  {
    name: 'Parliamentary',
    description: '2v2 Government vs Opposition format',
    peoplePerTeam: 2,
    speechesPerSpeaker: 1,
    firstSpeaker: 'affirmative' as const,
    icon: '🏛️',
    prepTime: 20,
    prepTimeType: 'pre-round' as const
  },
  {
    name: 'Spar Debate',
    description: '1v1 short format with quick constructive and rebuttal rounds',
    peoplePerTeam: 1,
    speechesPerSpeaker: 2,
    firstSpeaker: 'affirmative' as const,
    icon: '⚡',
    prepTime: 2,
    prepTimeType: 'pre-round' as const
  }
];

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode, onBack }) => {
  const [showFormatSelection, setShowFormatSelection] = useState(false);
  const [selectedMode, setSelectedMode] = useState<'debate' | 'practice' | null>(null);

  const handleModeSelect = (mode: 'debate' | 'practice') => {
    setSelectedMode(mode);
    setShowFormatSelection(true);
  };

  const handleFormatSelect = (format: any) => {
    onSelectMode(selectedMode!, format);
  };

  const handleBackToModeSelection = () => {
    setShowFormatSelection(false);
    setSelectedMode(null);
  };

  return (
    <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-4xl relative border border-blue-200/30">
      {/* Close Button */}
      {onBack && !showFormatSelection && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 flex items-center space-x-2 text-blue-700 hover:text-blue-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Home</span>
        </button>
      )}

      {/* Back Button for Format Selection */}
      {showFormatSelection && (
        <button
          onClick={handleBackToModeSelection}
          className="absolute top-6 left-6 flex items-center space-x-2 text-blue-700 hover:text-blue-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back to Mode Selection</span>
        </button>
      )}
      
      {!showFormatSelection ? (
        // Mode Selection
        <>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Choose Your Mode</h1>
            <p className="text-blue-600">Select how you'd like to practice and improve your debate skills</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Debate Mode Card */}
            <button
              onClick={() => handleModeSelect('debate')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105 text-left"
            >
              <div className="text-4xl mb-4">🏛️</div>
              <h3 className="text-xl font-bold mb-2">Debate Mode</h3>
              <p className="text-blue-100 text-sm mb-4">
                Practice against AI opponents with realistic debate scenarios and comprehensive analysis.
              </p>
              <div className="space-y-1 text-xs text-blue-200">
                <div>• AI-powered opponents</div>
                <div>• Real-time feedback</div>
                <div>• Comprehensive analysis</div>
              </div>
            </button>
            
            {/* Practice Mode Card */}
            <button
              onClick={() => handleModeSelect('practice')}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-left"
            >
              <div className="text-4xl mb-4">🎤</div>
              <h3 className="text-xl font-bold mb-2">Practice Mode</h3>
              <p className="text-indigo-100 text-sm mb-4">
                Practice specific speeches and get personalized feedback on your delivery and arguments.
              </p>
              <div className="space-y-1 text-xs text-indigo-200">
                <div>• Focused practice</div>
                <div>• Personalized feedback</div>
                <div>• Skill development</div>
              </div>
            </button>
          </div>
        </>
      ) : (
        // Format Selection
        <>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-900 mb-2">Choose Format</h1>
            <p className="text-blue-600">Select a debate format for your {selectedMode === 'debate' ? 'debate' : 'practice'} session</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEBATE_FORMATS.map((format) => (
              <button
                key={format.name}
                onClick={() => handleFormatSelect(format)}
                className="bg-gradient-to-br from-slate-50/80 to-gray-100/80 backdrop-blur-sm border-2 border-slate-200/50 rounded-xl p-6 hover:border-slate-400 hover:shadow-lg transition-all duration-200 text-left group"
              >
                <div className="text-4xl mb-4">{format.icon}</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-600">
                  {format.name}
                </h3>
                <p className="text-slate-700 text-sm mb-4">{format.description}</p>
                <div className="space-y-1 text-xs text-slate-600">
                  <div>👥 {format.peoplePerTeam === 1 ? '1v1' : `${format.peoplePerTeam}v${format.peoplePerTeam}`}</div>
                  <div>🎤 {format.speechesPerSpeaker} speech{format.speechesPerSpeaker > 1 ? 'es' : ''} per speaker</div>
                  <div>🥇 {format.firstSpeaker === 'affirmative' ? 'Aff' : 'Neg'} speaks first</div>
                  <div className="mt-2 pt-2 border-t border-slate-200">
                    <div className="font-medium text-slate-700">⏱️ Prep Time: {format.prepTime} min</div>
                    <div className="text-slate-500">
                      {format.prepTimeType === 'flexible' ? 'Use anytime during round' : 'Use before round starts'}
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Custom Format Option */}
            <button
              onClick={() => handleFormatSelect(null)}
              className="bg-gradient-to-br from-slate-50/80 to-gray-100/80 backdrop-blur-sm border-2 border-slate-200/50 rounded-xl p-6 hover:border-slate-400 hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="text-4xl mb-4">⚙️</div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2 group-hover:text-slate-600">
                Custom Format
              </h3>
              <p className="text-slate-700 text-sm mb-4">
                Create your own debate format with custom settings and rules
              </p>
              <div className="space-y-1 text-xs text-slate-600">
                <div>🎛️ Customize team sizes</div>
                <div>🎤 Set speech counts</div>
                <div>⚡ Flexible configuration</div>
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <div className="font-medium text-slate-700">⏱️ Prep Time: Custom</div>
                  <div className="text-slate-500">
                    Configure your own prep time
                  </div>
                </div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ModeSelection; 