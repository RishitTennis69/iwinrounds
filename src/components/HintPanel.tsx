import React, { useState } from 'react';
import { Speaker, DebatePoint } from '../types';
import { AIService } from '../utils/aiService';
import { Lightbulb, Target, MessageSquare } from 'lucide-react';

interface HintPanelProps {
  currentSpeaker: Speaker;
  session: any;
  hintsUsed: number;
  onHintUsed: () => void;
}

const HintPanel: React.FC<HintPanelProps> = ({ 
  currentSpeaker, 
  session, 
  hintsUsed, 
  onHintUsed 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hintType, setHintType] = useState<'cross-examination' | 'rebuttal' | null>(null);
  const [hintContent, setHintContent] = useState<string[]>([]);
  const [selectedArgument, setSelectedArgument] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const maxHints = 4;
  const remainingHints = maxHints - hintsUsed;

  // Get opponent arguments from previous speeches
  const getOpponentArguments = (): string[] => {
    const opponentTeam = currentSpeaker.team === 'affirmative' ? 'negative' : 'affirmative';
    const opponentSpeeches = session.points.filter((point: DebatePoint) => 
      point.team === opponentTeam
    );
    
    const opponentArgs: string[] = [];
    opponentSpeeches.forEach((speech: DebatePoint) => {
      opponentArgs.push(...speech.mainPoints);
      opponentArgs.push(...speech.counterPoints);
    });
    
    return opponentArgs.filter(arg => arg.trim().length > 0);
  };

  const handleCrossExaminationHint = async () => {
    if (remainingHints <= 0) {
      setError('No hints remaining for this round');
      return;
    }

    if (!selectedArgument) {
      setError('Please select an argument to generate cross-examination questions');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHintType('cross-examination');

    try {
      const questions = await AIService.generateCrossExaminationQuestions(
        selectedArgument, 
        session.topic
      );
      setHintContent(questions);
      onHintUsed();
    } catch (error) {
      setError('Failed to generate cross-examination questions. Please try again.');
      console.error('Error generating cross-examination questions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRebuttalHint = async () => {
    if (remainingHints <= 0) {
      setError('No hints remaining for this round');
      return;
    }

    if (!selectedArgument) {
      setError('Please select an argument to generate rebuttal hints');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHintType('rebuttal');

    try {
      const hint = await AIService.generateRebuttalHint(
        selectedArgument, 
        session.topic, 
        currentSpeaker.team
      );
      setHintContent([hint]);
      onHintUsed();
    } catch (error) {
      setError('Failed to generate rebuttal hint. Please try again.');
      console.error('Error generating rebuttal hint:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHints = () => {
    setHintType(null);
    setHintContent([]);
    setSelectedArgument('');
    setError(null);
  };

  const opponentArguments = getOpponentArguments();

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
          AI Debate Hints
        </h3>
        <div className="text-sm text-gray-600">
          {remainingHints}/{maxHints} hints remaining
        </div>
      </div>

      {remainingHints <= 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">
            No hints remaining for this round. Hints reset after each speech.
          </p>
        </div>
      )}

      {/* Argument Selection */}
      {opponentArguments.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select opponent argument to target:
          </label>
          <select
            value={selectedArgument}
            onChange={(e) => setSelectedArgument(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={remainingHints <= 0}
          >
            <option value="">Choose an argument...</option>
            {opponentArguments.map((arg, index) => (
              <option key={index} value={arg}>
                {arg.length > 60 ? arg.substring(0, 60) + '...' : arg}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Hint Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleCrossExaminationHint}
          disabled={remainingHints <= 0 || !selectedArgument || isLoading}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Target className="w-4 h-4" />
          <span>Cross-Examination Questions</span>
        </button>
        
        <button
          onClick={handleRebuttalHint}
          disabled={remainingHints <= 0 || !selectedArgument || isLoading}
          className="flex items-center justify-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Rebuttal Hint</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-blue-800 text-sm">
              Generating {hintType === 'cross-examination' ? 'cross-examination questions' : 'rebuttal hint'}...
            </span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Hint Content Display */}
      {hintContent.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">
              {hintType === 'cross-examination' ? 'Cross-Examination Questions' : 'Rebuttal Hint'}
            </h4>
            <button
              onClick={clearHints}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear
            </button>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            {hintType === 'cross-examination' ? (
              <div className="space-y-2">
                {hintContent.map((question, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <span className="text-blue-600 font-medium text-sm min-w-[20px]">
                      {index + 1}.
                    </span>
                    <p className="text-gray-700 text-sm">{question}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700 text-sm">{hintContent[0]}</p>
            )}
          </div>
        </div>
      )}

      {/* No opponent arguments message */}
      {opponentArguments.length === 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-600 text-sm text-center">
            No opponent arguments available yet. Hints will be available after opponents have spoken.
          </p>
        </div>
      )}
    </div>
  );
};

export default HintPanel; 