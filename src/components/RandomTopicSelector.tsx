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
        className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105"
      >
        <Shuffle className="w-5 h-5" />
        <span>Get Random Topics</span>
      </button>

      {/* Topic Options Modal */}
      {showOptions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Choose a Debate Topic</h3>
              <p className="text-gray-600">Select one of these randomly generated topics:</p>
            </div>

            <div className="space-y-3 mb-6">
              {topics.map((topic, index) => (
                <button
                  key={index}
                  onClick={() => handleTopicSelect(topic)}
                  className="w-full text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200 group"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium group-hover:bg-purple-200 transition-colors">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium leading-relaxed">{topic}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleNewRandomTopics}
                className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <Shuffle className="w-4 h-4" />
                <span>New Topics</span>
              </button>
              <button
                onClick={() => setShowOptions(false)}
                className="flex-1 bg-gray-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
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