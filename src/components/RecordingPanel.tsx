import React, { useState, useEffect } from 'react';
import { Speaker } from '../types';
import { SimpleSpeechService } from '../utils/simpleSpeechService';
import { Mic, AlertCircle, CheckCircle, RotateCcw, Square } from 'lucide-react';

interface RecordingPanelProps {
  currentSpeaker: Speaker | null;
  speechNumber: number;
  totalSpeeches: number;
  onSpeechComplete: (transcript: string) => void;
  speechRecognition: SimpleSpeechService;
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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
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
      // Stop recording if it's still running
      if (isRecording) {
        speechRecognition.stopRecording();
        setIsRecording(false);
      }
      
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

  if (!currentSpeaker) {
    return (
      <div className="bg-white backdrop-blur-sm rounded-lg shadow-md p-6 border border-gray-200">
        <p className="text-gray-700 text-center">No speaker selected</p>
      </div>
    );
  }

  return (
    <div className="bg-white backdrop-blur-sm rounded-lg shadow-md p-6 border border-gray-200">
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
        <p className="text-sm text-gray-700">
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
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Mic className="w-5 h-5" />
              <span>Start Recording</span>
            </button>
          ) : (
            <button
              onClick={restartRecording}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Restart</span>
            </button>
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
          <div className="text-3xl font-mono text-gray-900 mb-4">
            {formatTime(duration)}
          </div>
          <p className="text-sm text-gray-600 font-medium">
            Speech Duration
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
        <div className="bg-white backdrop-blur-sm rounded-lg p-4 min-h-[100px] max-h-[200px] overflow-y-auto border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Transcript:</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
        </div>

        {/* Complete Button */}
        {transcript && !isAnalyzing && (
          <div className="text-center">
            <button
              onClick={handleComplete}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Complete Speech
            </button>
          </div>
        )}

        {/* Analysis Status */}
        {isAnalyzing && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Analyzing speech...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecordingPanel; 