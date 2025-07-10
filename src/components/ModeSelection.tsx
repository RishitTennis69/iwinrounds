import React from 'react';
import { Users, Target } from 'lucide-react';

interface ModeSelectionProps {
  onSelectMode: (mode: 'debate' | 'practice') => void;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const ModeSelection: React.FC<ModeSelectionProps> = ({ 
  onSelectMode, 
  freeRoundsUsed = 0, 
  isAdmin = false 
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">DebateFlowy</h1>
          <p className="text-xl text-gray-600 mb-2">AI-Powered Debate Analysis & Flow Tracking</p>
          <p className="text-lg text-gray-500">Choose your mode to get started</p>
          
          {/* Free Rounds Status */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg inline-block">
            {isAdmin ? (
              <div className="text-green-600 font-medium text-lg">
                ✓ Admin Access - Unlimited Rounds
              </div>
            ) : (
              <div className="text-gray-700 text-lg">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Debate Mode */}
          <div 
            className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl p-8 text-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => onSelectMode('debate')}
          >
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto mb-6 text-white" />
              <h2 className="text-3xl font-bold mb-4">Debate Mode</h2>
              <p className="text-blue-100 text-lg mb-6">
                Full competitive debate with 4 speakers, AI analysis, and real-time flow tracking
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>4 speakers (2 per team)</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>8 speeches total</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>AI-powered analysis</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Cross-examination hints</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Rebuttal assistance</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Final winner analysis</span>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Mode */}
          <div 
            className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-8 text-white cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            onClick={() => onSelectMode('practice')}
          >
            <div className="text-center">
              <Target className="w-16 h-16 mx-auto mb-6 text-white" />
              <h2 className="text-3xl font-bold mb-4">Practice Mode</h2>
              <p className="text-green-100 text-lg mb-6">
                Individual practice sessions with AI opponents and personalized coaching
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Individual practice</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>AI opponent generation</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Personalized feedback</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Real-time speech analysis</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Position-specific coaching</span>
                </div>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                  <span>Performance scoring</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500 text-sm">
            Select a mode to begin your debate experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default ModeSelection; 