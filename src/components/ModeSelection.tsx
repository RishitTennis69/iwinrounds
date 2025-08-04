import React, { useState } from 'react';
import { Map } from 'lucide-react';
import { HeroSection } from './ui/spline-demo';

interface ModeSelectionProps {
  onSelectMode: (mode: 'debate' | 'practice') => void;
  onBack?: () => void;
}

const features = [
  {
    icon: (
      <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
    ),
    title: 'Always-on Judge',
    desc: 'Get instant, unbiased feedback after every speech—no more waiting for a judge.'
  },
  {
    icon: (
      // Microphone icon from Heroicons (solid)
      <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.25a3.75 3.75 0 00-3.75 3.75v6a3.75 3.75 0 007.5 0v-6A3.75 3.75 0 0012 2.25z" /><path d="M19.5 10.5a.75.75 0 01.75.75 7.5 7.5 0 01-7.5 7.5 7.5 7.5 0 01-7.5-7.5.75.75 0 01.75-.75.75.75 0 01.75.75 6 6 0 0012 0 .75.75 0 01.75-.75z" /><path d="M12 21.75a.75.75 0 01-.75-.75v-1.5a.75.75 0 011.5 0v1.5a.75.75 0 01-.75.75z" /></svg>
    ),
    title: 'Practice Any Speech',
    desc: 'Rebuttal, summary, or anything in between—practice any speech, any time.'
  },
  {
    icon: (
      // Chat bubble left-right icon from Heroicons (solid)
      <svg className="w-8 h-8 text-indigo-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M2.25 12c0-4.556 4.694-8.25 9.75-8.25s9.75 3.694 9.75 8.25-4.694 8.25-9.75 8.25a10.7 10.7 0 01-3.1-.44c-.37-.11-.77-.04-1.06.19l-2.12 1.7a.75.75 0 01-1.2-.6v-2.13c0-.32-.13-.63-.36-.86A7.48 7.48 0 012.25 12zm7.5-2.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
    ),
    title: 'Personalized Feedback',
    desc: 'AI-powered insights tailored to your arguments and speaking style.'
  },
  {
    icon: (
      <Map className="w-8 h-8 text-blue-600" />
    ),
    title: 'Argument Mapping',
    desc: 'Visual argument flow with logical fallacy detection and strength analysis.'
  },
];

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode, onBack }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-4xl relative border border-blue-200/30">
      {/* Close Button */}
      {onBack && (
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
      
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-blue-900 mb-2">Choose Your Mode</h1>
        <p className="text-blue-600">Select how you'd like to practice and improve your debate skills</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debate Mode Card */}
        <button
          onClick={() => onSelectMode('debate')}
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
          onClick={() => onSelectMode('practice')}
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
    </div>
  );
};

export default ModeSelection; 