import React, { useState } from 'react';

interface ModeSelectionProps {
  onSelectMode: (mode: 'debate' | 'practice') => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 opacity-30 rounded-full blur-3xl -z-10 animate-pulse" style={{ top: '-6rem', left: '-6rem' }}></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-200 opacity-30 rounded-full blur-3xl -z-10 animate-pulse" style={{ bottom: '-6rem', right: '-6rem' }}></div>
      {/* Hero Section */}
      <div className="w-full max-w-2xl text-center mb-12 mt-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-800 mb-6 drop-shadow-lg">Dedicate AI</h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6 font-medium">
          (Incomplete judge feedback? Never got to practice your rebuttal speech? Felt like your team won but needed validation? DedicateAI swoops in for you, the dedicated debater, and makes sure the judge is always listening, that you can practice whatever speech you want whenever you want, and it gives you personalized feedback and ways to improve.)
        </p>
        <button
          className="mt-8 px-10 py-4 bg-gradient-to-r from-blue-600 to-emerald-500 text-white text-xl font-semibold rounded-full shadow-lg hover:from-blue-700 hover:to-emerald-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
          onClick={() => setShowModal(true)}
        >
          Continue
        </button>
      </div>
      {/* Mode Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative animate-fade-in">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold focus:outline-none"
              onClick={() => setShowModal(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Choose Your Mode</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Debate Mode Card */}
              <button
                className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-200 hover:border-green-400 transition-all duration-200 cursor-pointer shadow-md flex flex-col items-center focus:outline-none focus:ring-2 focus:ring-green-400"
                onClick={() => { setShowModal(false); setTimeout(() => onSelectMode('debate'), 200); }}
              >
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Debate Mode</h3>
                <p className="text-green-700 mb-2 text-center">Full debate simulation with real-time speech analysis and AI feedback</p>
                <ul className="text-sm text-green-600 space-y-1 text-left mx-auto">
                  <li>• Real-time speech recording</li>
                  <li>• AI-powered analysis</li>
                  <li>• Live debate flow tracking</li>
                  <li>• Personalized speaker feedback</li>
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