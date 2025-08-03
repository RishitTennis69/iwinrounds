import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

interface PrepTimeProps {
  totalPrepTime: number; // in minutes
  prepTimeType: 'flexible' | 'pre-round';
  onPrepTimeUsed: (timeUsed: number) => void;
  onPrepTimeComplete?: () => void;
  isActive?: boolean;
  className?: string;
}

const PrepTime: React.FC<PrepTimeProps> = ({
  totalPrepTime,
  prepTimeType,
  onPrepTimeUsed,
  onPrepTimeComplete,
  isActive = false,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(totalPrepTime * 60); // Convert to seconds
  const [timeUsed, setTimeUsed] = useState(0);

  // If no prep time, don't render anything
  if (totalPrepTime === 0) {
    return null;
  }

  useEffect(() => {
    let interval: number;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            setIsRunning(false);
            onPrepTimeComplete?.();
          }
          return newTime;
        });
        setTimeUsed(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, onPrepTimeComplete]);

  const startPrepTime = () => {
    if (timeRemaining > 0) {
      setIsRunning(true);
      onPrepTimeUsed(timeUsed);
    }
  };

  const pausePrepTime = () => {
    setIsRunning(false);
  };

  const resetPrepTime = () => {
    setIsRunning(false);
    setTimeRemaining(totalPrepTime * 60);
    setTimeUsed(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPrepTimeTypeText = () => {
    return prepTimeType === 'flexible' 
      ? 'Use anytime during the round' 
      : 'Use before the round starts';
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Prep Time</h3>
        </div>
        <div className="text-sm text-gray-500">
          {getPrepTimeTypeText()}
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-3xl font-bold text-blue-600 mb-2">
          {formatTime(timeRemaining)}
        </div>
        <div className="text-sm text-gray-500">
          {timeUsed > 0 && `Used: ${formatTime(timeUsed)}`}
        </div>
      </div>

      <div className="flex justify-center space-x-3">
        {!isRunning && timeRemaining > 0 && (
          <button
            onClick={startPrepTime}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Start Prep</span>
          </button>
        )}
        
        {isRunning && (
          <button
            onClick={pausePrepTime}
            className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        )}
        
        {timeRemaining < totalPrepTime * 60 && (
          <button
            onClick={resetPrepTime}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {timeRemaining === 0 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 text-center">
            Prep time has been used up!
          </p>
        </div>
      )}
    </div>
  );
};

export default PrepTime; 