import React from 'react';

interface ModeSelectionProps {
  onSelectMode: (mode: 'debate' | 'practice') => void;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ onSelectMode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Dedicate AI</h1>
          <p className="text-lg text-gray-600 mb-4">(Incomplete judge feedback? Never got to practice your rebuttal speech? Felt like your team won but needed validation? DedicateAI swoops in for you, the dedicated debater, and makes sure the judge is always listening, that you can practice whatever speech you want whenever you want, and it gives you personalized feedback and ways to improve.)</p>
          <p className="text-xl text-gray-600">Choose your debate experience</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Debate Mode */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl p-6 border-2 border-green-200 hover:border-green-300 transition-all duration-200 cursor-pointer" onClick={() => onSelectMode('debate')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">Debate Mode</h2>
              <p className="text-green-700 mb-4">Full debate simulation with real-time speech analysis and AI feedback</p>
              <ul className="text-sm text-green-600 space-y-1 text-left">
                <li>• Real-time speech recording</li>
                <li>• AI-powered analysis</li>
                <li>• Live debate flow tracking</li>
                <li>• Personalized speaker feedback</li>
                <li>• Winner determination</li>
              </ul>
            </div>
          </div>

          {/* Practice Mode */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-6 border-2 border-blue-200 hover:border-blue-300 transition-all duration-200 cursor-pointer" onClick={() => onSelectMode('practice')}>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-blue-800 mb-2">Practice Mode</h2>
              <p className="text-blue-700 mb-4">Practice with AI-generated context and personalized feedback</p>
              <ul className="text-sm text-blue-600 space-y-1 text-left">
                <li>• AI-generated previous speeches</li>
                <li>• Focus on your speeches only</li>
                <li>• Full debate context</li>
                <li>• Personalized feedback</li>
                <li>• No round limitations</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection; 