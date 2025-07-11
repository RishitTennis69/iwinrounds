import React, { useState, useEffect } from 'react';
import { Speaker } from '../types';
import { SpeechRecognitionService } from '../utils/speechRecognition';
import { Mic, Square, Pause, Play, AlertCircle, CheckCircle } from 'lucide-react';

interface RecordingPanelProps {
  currentSpeaker: Speaker | null;
  speechNumber: number;
  onSpeechComplete: (transcript: string) => void;
  speechRecognition: SpeechRecognitionService;
  isAnalyzing: boolean;
}

const RecordingPanel: React.FC<RecordingPanelProps> = ({
  currentSpeaker,
  speechNumber,
  onSpeechComplete,
  speechRecognition,
  isAnalyzing
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [autoRestartCount, setAutoRestartCount] = useState(0);
  const [restartAttempts, setRestartAttempts] = useState(0);
  const [timeSinceActivity, setTimeSinceActivity] = useState(0);
  const [isSessionActive, setIsSessionActive] = useState(true);

  const maxSpeechDuration = 4 * 60; // 4 minutes in seconds

  useEffect(() => {
    let interval: number;
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          // Auto-stop after 4 minutes
          if (newDuration >= maxSpeechDuration) {
            stopRecording();
            return prev;
          }
          return newDuration;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording, isPaused]);

  // Track session duration and activity
  useEffect(() => {
    let sessionInterval: number;
    if (isRecording) {
      sessionInterval = setInterval(() => {
        const sessionTime = speechRecognition.getSessionDuration();
        const restartCount = speechRecognition.getRestartAttempts();
        const timeSinceLastActivity = speechRecognition.getTimeSinceLastActivity();
        const sessionActive = speechRecognition.isSessionActive();
        
        setSessionDuration(sessionTime);
        setRestartAttempts(restartCount);
        setTimeSinceActivity(timeSinceLastActivity);
        setIsSessionActive(sessionActive);
      }, 1000);
    }
    return () => clearInterval(sessionInterval);
  }, [isRecording, speechRecognition]);

  const startRecording = async () => {
    if (!currentSpeaker) return;
    
    setError(null);
    setTranscript('');
    setDuration(0);
    setSessionDuration(0);
    setAutoRestartCount(0);
    setRestartAttempts(0);
    setTimeSinceActivity(0);
    setIsSessionActive(true);
    setIsRecording(true);
    setIsPaused(false);

    try {
      await speechRecognition.startRecording(
        (newTranscript: string) => {
          setTranscript(newTranscript);
        },
        (error: string) => {
          console.log('Speech recognition error:', error);
          // Don't stop recording for recoverable errors
          if (error === 'no-speech' || error === 'audio-capture' || error === 'network') {
            setAutoRestartCount(prev => prev + 1);
            setError(`Recovering from ${error}... (Auto-restart #${autoRestartCount + 1})`);
            // Clear error after 3 seconds
            setTimeout(() => setError(null), 3000);
          } else {
            setError(`Recording error: ${error}`);
            setIsRecording(false);
          }
        }
      );
    } catch (err) {
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    speechRecognition.stopRecording();
    setIsRecording(false);
    setIsPaused(false);
  };

  const pauseRecording = () => {
    speechRecognition.pauseRecording();
    setIsPaused(true);
  };

  const resumeRecording = () => {
    speechRecognition.resumeRecording();
    setIsPaused(false);
  };

  const handleComplete = () => {
    if (transcript.trim()) {
      onSpeechComplete(transcript);
      setTranscript('');
      setDuration(0);
      setSessionDuration(0);
      setAutoRestartCount(0);
      setRestartAttempts(0);
      setTimeSinceActivity(0);
      setIsSessionActive(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeRemaining = () => {
    const remaining = maxSpeechDuration - duration;
    return formatTime(Math.max(0, remaining));
  };

  const getProgressPercentage = () => {
    return Math.min(100, (duration / maxSpeechDuration) * 100);
  };

  if (!currentSpeaker) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500 text-center">No speaker selected</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Speech {speechNumber}/8
        </h3>
        <div className="flex items-center justify-center space-x-2 mb-2">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            currentSpeaker.team === 'affirmative' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {currentSpeaker.team}
          </span>
          <span className="text-gray-600">•</span>
          <span className="font-medium text-gray-900">{currentSpeaker.name}</span>
        </div>
        <p className="text-sm text-gray-500">
          {speechNumber % 2 === 1 ? 'First' : 'Second'} {currentSpeaker.team} speaker
        </p>
      </div>

      <div className="space-y-4">
        {/* Recording Controls */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isAnalyzing}
              className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              {!isPaused ? (
                <button
                  onClick={pauseRecording}
                  className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Pause className="w-5 h-5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={resumeRecording}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Play className="w-5 h-5" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Square className="w-5 h-5" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>

        {/* Timer and Progress */}
        {isRecording && (
          <div className="text-center space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Elapsed: {formatTime(duration)}</span>
              <span>Remaining: {getTimeRemaining()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <div className="text-sm text-gray-500">
              {isPaused ? 'Paused' : 'Recording...'}
              {autoRestartCount > 0 && (
                <span className="ml-2 text-yellow-600">
                  Auto-restarts: {autoRestartCount}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Session Duration Info */}
        {isRecording && sessionDuration > 0 && (
          <div className="text-center text-xs text-gray-500 space-y-1">
            <div>Session duration: {formatTime(Math.floor(sessionDuration / 1000))}</div>
            {restartAttempts > 0 && (
              <div className="text-yellow-600">
                Auto-restarts: {restartAttempts}/10
              </div>
            )}
            {timeSinceActivity > 10000 && (
              <div className="text-orange-600">
                No activity for: {formatTime(Math.floor(timeSinceActivity / 1000))}
              </div>
            )}
            {!isSessionActive && (
              <div className="text-red-600">
                Session may be inactive
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {!isRecording && transcript.trim() && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <p className="text-green-800 text-sm">Recording completed successfully!</p>
            </div>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Live Transcript:</h4>
              <span className="text-xs text-gray-500">
                {transcript.split(' ').length} words
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{transcript}</p>
            </div>
            
            {!isRecording && transcript.trim() && (
              <button
                onClick={handleComplete}
                disabled={isAnalyzing}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? 'Analyzing...' : 'Complete Speech & Analyze'}
              </button>
            )}
          </div>
        )}

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-blue-800 text-sm">AI is analyzing the speech...</span>
            </div>
          </div>
        )}

        {/* Speech Duration Warning */}
        {duration >= maxSpeechDuration - 30 && duration < maxSpeechDuration && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <p className="text-yellow-800 text-sm">
                Warning: Speech will auto-stop in {getTimeRemaining()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingPanel; 