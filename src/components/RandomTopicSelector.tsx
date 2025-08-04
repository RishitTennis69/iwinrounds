import React, { useState } from 'react';
import { generateRandomTopics } from '../utils/topicGenerator';
import { Shuffle } from 'lucide-react';

interface RandomTopicSelectorProps {
  onTopicSelect: (topic: string) => void;
}

const RandomTopicSelector: React.FC<RandomTopicSelectorProps> = ({ onTopicSelect }) => {
  const [showOptions, setShowOptions] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);

  const handleRandomTopicClick = () => {
    const randomTopics = generateRandomTopics();
    setTopics(randomTopics);
    setShowOptions(true);
  };

  const handleTopicSelect = (selectedTopic: string) => {
    onTopicSelect(selectedTopic);
    setShowOptions(false);
  };

  const handleNewRandomTopics = () => {
    const randomTopics = generateRandomTopics();
    setTopics(randomTopics);
  };

  return (
    <div className="space-y-4">
      {/* Random Topic Button */}
      <button
        type="button"
        onClick={handleRandomTopicClick}
        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
      >
        <Shuffle className="w-5 h-5" />
        <span>Get Random Topics</span>
      </button>

      {/* Topic Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto border border-blue-200/30">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-blue-900 mb-2">Choose a Debate Topic</h3>
              <p className="text-blue-700">Select one of these randomly generated topics:</p>
            </div>

            <div className="space-y-3 mb-6">
              {topics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTopicSelect(topic)}
                  className="w-full text-left p-4 border-2 border-blue-200/50 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 group bg-white"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium group-hover:bg-blue-200 transition-colors">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-blue-800 font-medium leading-relaxed">{topic}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleNewRandomTopics}
                className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-blue-700 py-3 px-4 rounded-lg font-medium hover:bg-blue-100 transition-colors border border-blue-200/30"
              >
                <Shuffle className="w-4 h-4" />
                <span>New Topics</span>
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RandomTopicSelector; 