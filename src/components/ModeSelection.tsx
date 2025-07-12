import React, { useState } from 'react';
import { Map } from 'lucide-react';

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
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Hero Section */}
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-between mb-16 mt-12">
        {/* Left: Text */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-5xl md:text-6xl font-bold text-blue-600 mb-2 drop-shadow-lg">Dedicate AI</h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-blue-400 mb-4">Your Debate Pal</h2>
          <p className="text-xl text-gray-700 mb-4 font-medium">AI-powered debate feedback, practice, and validation—anytime, anywhere.</p>
          <p className="text-md text-gray-600 mb-8">Never miss out on judge feedback, practice any speech, and get personalized insights to improve your debating skills.</p>
          <button
            className="px-10 py-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xl font-semibold rounded-full shadow-lg hover:from-blue-700 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
            onClick={() => setShowModal(true)}
          >
            Get Started
          </button>
        </div>
        {/* Right: Illustration/Icon */}
        <div className="flex-1 flex justify-center md:justify-end mt-12 md:mt-0">
          <div className="w-80 h-80 bg-white rounded-3xl flex items-center justify-center shadow-xl relative overflow-visible">
            <img
              src="/image-removebg-preview.png"
              alt="Debate illustration"
              className="w-72 h-72 object-contain rounded-2xl bg-white"
            />
          </div>
        </div>
      </div>
      {/* Features Section */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
        {features.map((f, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-md p-6 flex flex-col items-center border-t-4" style={{ borderColor: ['#34d399', '#3b82f6', '#a78bfa', '#f59e0b'][i] }}>
            <div className="mb-4">{f.icon}</div>
            <h3 className="text-lg font-bold mb-2 text-gray-800">{f.title}</h3>
            <p className="text-gray-600 text-center">{f.desc}</p>
          </div>
        ))}
      </div>
      {/* Mode Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-2xl relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">How do you want to use Dedicate AI?</h2>
            <div className="flex flex-row gap-6 flex-wrap justify-center items-stretch">
              {/* Debate Mode Card */}
              <button
                className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all duration-200 cursor-pointer shadow-md flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={() => { setShowModal(false); setTimeout(() => onSelectMode('debate'), 200); }}
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Debate Mode</h3>
                <p className="text-green-700 mb-2 text-center">Full debate simulation with real-time speech analysis and AI feedback</p>
                <ul className="text-sm text-green-600 space-y-1 text-left mx-auto">
                  <li>• Real-time speech recording</li>
                  <li>• AI-powered analysis</li>
                  <li>• Live debate flow tracking</li>
                  <li>• Argument mapping</li>
                  <li>• Winner determination</li>
                </ul>
              </button>
              {/* Argument Mapping Mode Card */}
              <button
                className="bg-gradient-to-br from-purple-50 to-indigo-100 rounded-xl p-6 border-2 border-purple-200 hover:border-purple-400 transition-all duration-200 cursor-pointer shadow-md flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                onClick={() => { setShowModal(false); setTimeout(() => onSelectMode('argument-mapping'), 200); }}
              >
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                  <Map className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-800 mb-2">Argument Mapping Mode</h3>
                <p className="text-purple-700 mb-2 text-center">Debate with live argument mapping instead of table flow</p>
                <ul className="text-sm text-purple-600 space-y-1 text-left mx-auto">
                  <li>• Real-time speech recording</li>
                  <li>• Live argument mapping</li>
                  <li>• Logical fallacy detection</li>
                  <li>• Visual argument flow</li>
                  <li>• Winner determination</li>
                </ul>
              </button>
              {/* Practice Mode Card */}
              <button
                className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-400 transition-all duration-200 cursor-pointer shadow-md flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => { setShowModal(false); setTimeout(() => onSelectMode('practice'), 200); }}
              >
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="2" y="2" width="20" height="20" rx="6" strokeWidth="2" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-blue-800 mb-2">Practice Mode</h3>
                <p className="text-blue-700 mb-2 text-center">Practice with AI-generated context and personalized feedback</p>
                <ul className="text-sm text-blue-600 space-y-1 text-left mx-auto">
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