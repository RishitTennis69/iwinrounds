import React, { useState } from 'react';
import { Map } from 'lucide-react';
import FuturisticHero from './ui/hero-futuristic';

interface ModeSelectionProps {
  onSelectMode: (mode: 'debate' | 'practice' | 'argument-mapping') => void;
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
      <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M2.25 12c0-4.556 4.694-8.25 9.75-8.25s9.75 3.694 9.75 8.25-4.694 8.25-9.75 8.25a10.7 10.7 0 01-3.1-.44c-.37-.11-.77-.04-1.06.19l-2.12 1.7a.75.75 0 01-1.2-.6v-2.13c0-.32-.13-.63-.36-.86A7.48 7.48 0 012.25 12zm7.5-2.25a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75zm0 3a.75.75 0 01.75-.75h3a.75.75 0 010 1.5h-3a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>
    ),
    title: 'Personalized Feedback',
    desc: 'AI-powered insights tailored to your arguments and speaking style.'
  },
  {
    icon: (
      <Map className="w-8 h-8 text-amber-500" />
    ),
    title: 'Argument Mapping',
    desc: 'Visual argument flow with logical fallacy detection and strength analysis.'
  },
];

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Futuristic Hero Section */}
      <div className="relative z-10">
        <FuturisticHero />
        {/* Override the explore button to show modal */}
        <button
          className="explore-btn"
          style={{ animationDelay: '2.5s' }}
          onClick={() => setShowModal(true)}
        >
          Get Started
          <span className="explore-arrow">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" className="arrow-svg">
              <path d="M11 5V17" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 12L11 17L16 12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </span>
        </button>
      </div>

      {/* Features Section - Now with dark theme */}
      <div className="relative z-20 bg-gradient-to-b from-black via-gray-900 to-black py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Powered by Advanced AI
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience the future of debate training with cutting-edge artificial intelligence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 flex flex-col items-center border border-gray-700 hover:border-blue-500 transition-all duration-300 hover:transform hover:scale-105"
              >
                <div className="mb-4 p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  {f.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{f.title}</h3>
                <p className="text-gray-300 text-center text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700 rounded-2xl shadow-2xl p-6 w-full max-w-5xl relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-3xl font-bold text-white mb-6">How do you want to use ReasynAI?</h2>
            <div className="flex flex-row gap-6 justify-center items-stretch w-full">
              {/* Debate Mode Card */}
              <button
                className="flex-1 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all duration-200 cursor-pointer shadow-md flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-green-400 min-w-[280px] max-w-[400px]"
                onClick={() => { setShowModal(false); setTimeout(() => onSelectMode('debate'), 200); }}
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Debate Mode</h3>
                <p className="text-white mb-2 text-center">Full debate simulation with real-time speech analysis and AI feedback</p>
                <ul className="text-sm text-gray-300 space-y-1 text-left mx-auto">
                  <li>• Real-time speech recording</li>
                  <li>• AI-powered analysis</li>
                  <li>• Live debate flow tracking</li>
                  <li>• Argument mapping</li>
                  <li>• Winner determination</li>
                </ul>
              </button>
              {/* Practice Mode Card */}
              <button
                className="flex-1 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-md flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[280px] max-w-[400px]"
                onClick={() => { setShowModal(false); setTimeout(() => onSelectMode('practice'), 200); }}
              >
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-2">Practice Mode</h3>
                <p className="text-white mb-2 text-center">Practice with AI-generated context and personalized feedback</p>
                <ul className="text-sm text-gray-300 space-y-1 text-left mx-auto">
                  <li>• AI-generated previous speeches</li>
                  <li>• Focus on your speeches only</li>
                  <li>• Full debate context</li>
                  <li>• Personalized feedback</li>
                  <li>• No round limitations</li>
                </ul>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModeSelection; 