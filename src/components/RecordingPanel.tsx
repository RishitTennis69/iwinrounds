import React, { useState, useEffect } from 'react';
import { Speaker } from '../types';
import { WhisperService } from '../utils/whisperService';
import { Mic, AlertCircle, CheckCircle, RotateCcw, Square } from 'lucide-react';

interface RecordingPanelProps {
  currentSpeaker: Speaker | null;
  speechNumber: number;
  totalSpeeches: number;
  onSpeechComplete: (transcript: string) => void;
  speechRecognition: WhisperService;
  isAnalyzing: boolean;
}

const RecordingPanel: React.FC<RecordingPanelProps> = ({
  currentSpeaker,
  speechNumber,
  totalSpeeches,
  onSpeechComplete,
  speechRecognition,
  isAnalyzing
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');

  const maxSpeechDuration = 4 * 60; // 4 minutes in seconds

  useEffect(() => {
    let interval: number;
    if (isRecording) {
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
  }, [isRecording]);

  const startRecording = async () => {
    if (!currentSpeaker) return;
    
    setError(null);
    setTranscript('');
    setDuration(0);
    setIsRecording(true);
    setIsProcessing(false);
    setProcessingStatus('');

    try {
      await speechRecognition.startRecording(
        (newTranscript: string) => {
          setTranscript(newTranscript);
        },
        (error: string) => {
          console.log('Whisper API error:', error);
          setError(`Recording error: ${error}`);
          setIsRecording(false);
          setIsProcessing(false);
        },
        (status: string) => {
          setProcessingStatus(status);
          if (status === 'Processing audio...') {
            setIsProcessing(true);
          } else if (status === 'Transcript ready!' || status === 'No speech detected, please try again') {
            setIsProcessing(false);
          }
        }
      );
    } catch (err) {
      setError('Failed to start recording. Please check microphone permissions.');
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    
    setIsProcessing(true);
    setProcessingStatus('Processing audio...');
    speechRecognition.stopRecording();
    setIsRecording(false);
  };

  const restartRecording = async () => {
    // Stop current recording if it's running
    if (isRecording) {
      speechRecognition.stopRecording();
    }
    
    // Reset all state
    setIsRecording(false);
    setTranscript('');
    setDuration(0);
    setError(null);
    setIsProcessing(false);
    setProcessingStatus('');
    
    // Start a new recording
    await startRecording();
  };

  const handleComplete = () => {
    if (transcript.trim()) {
      onSpeechComplete(transcript);
      setTranscript('');
      setDuration(0);
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
          Speech {speechNumber}/{totalSpeeches}
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
              <button
                onClick={stopRecording}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Square className="w-5 h-5" />
                <span>End Recording</span>
              </button>
              <button
                onClick={restartRecording}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                <span>Restart</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex items-center justify-center space-x-4">
          {isRecording && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Recording...</span>
            </div>
          )}
          {isProcessing && (
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">{processingStatus}</span>
            </div>
          )}
        </div>

        {/* Timer and Progress */}
        <div className="text-center">
          <div className="text-2xl font-mono text-gray-900 mb-2">
            {formatTime(duration)}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Time remaining: {getTimeRemaining()}
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Transcript Display */}
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Transcript:</h4>
          <div className="bg-gray-50 rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto">
            {transcript ? (
              <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-gray-500 italic">
                {isRecording ? 'Listening...' : 'No transcript yet'}
              </p>
            )}
          </div>
        </div>

        {/* Complete Button */}
        {transcript.trim() && !isRecording && !isProcessing && (
          <div className="flex justify-center">
            <button
              onClick={handleComplete}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              <span>Complete Speech</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingPanel; 