import React, { useState, useEffect } from 'react';
import { Speaker } from '../types';
import { SpeechRecognitionService } from '../utils/speechRecognition';
import { Mic, Square } from 'lucide-react';

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
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: number;
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

    try {
      await speechRecognition.startRecording(
        (newTranscript) => {
          setTranscript(newTranscript);
        },
        (error) => {
          setError(error);
          setIsRecording(false);
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
            <button
              onClick={stopRecording}
              className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </button>
          )}
        </div>

        {/* Timer */}
        {isRecording && (
          <div className="text-center">
            <div className="text-2xl font-mono text-gray-900">
              {formatTime(duration)}
            </div>
            <div className="text-sm text-gray-500">Recording...</div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Transcript Display */}
        {transcript && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Live Transcript:</h4>
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
      </div>
    </div>
  );
};

export default RecordingPanel; 