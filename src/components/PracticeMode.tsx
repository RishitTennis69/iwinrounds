import React, { useState } from 'react';
import { DebatePoint, DebateSession } from '../types';
import { SpeechRecognitionService } from '../utils/speechRecognition';
import { AIService } from '../utils/aiService';
import { Mic, Square, ArrowLeft, Target } from 'lucide-react';

interface PracticeModeProps {
  onBack: () => void;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ onBack, freeRoundsUsed = 0, isAdmin = false }) => {
  const [step, setStep] = useState<'setup' | 'practice' | 'generating'>('setup');
  const [topic, setTopic] = useState('');
  const [userName, setUserName] = useState('');
  const [userTeam, setUserTeam] = useState<'affirmative' | 'negative'>('affirmative');
  const [userSpeakerNumber, setUserSpeakerNumber] = useState<1 | 2>(1);
  const [currentSpeech, setCurrentSpeech] = useState(1);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [practiceSession, setPracticeSession] = useState<DebateSession | null>(null);
  const [speechRecognition] = useState(() => new SpeechRecognitionService());

  const handleStartPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !userName.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const newSession: DebateSession = {
      id: Date.now().toString(),
      topic,
      speakers: [
        { id: 'user', name: userName, team: userTeam, points: 0 }
      ],
      points: [],
      startTime: new Date(),
      hintsUsed: 0
    };

    setPracticeSession(newSession);
    
    // If user is not 1st speaker, generate previous speeches first
    if (userSpeakerNumber === 2) {
      setStep('generating');
      generatePreviousSpeeches();
    } else {
      setStep('practice');
    }
  };

  const startRecording = async () => {
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

  const handleCompleteSpeech = async () => {
    if (!transcript.trim() || !practiceSession) return;

    setIsAnalyzing(true);
    
    try {
      // Analyze user's speech
      const analysis = await AIService.summarizeSpeech(transcript);
      
      const userPoint: DebatePoint = {
        id: Date.now().toString(),
        speakerId: 'user',
        speakerName: userName,
        team: userTeam,
        speechNumber: currentSpeech,
        mainPoints: analysis.mainPoints,
        counterPoints: analysis.counterPoints,
        counterCounterPoints: analysis.counterCounterPoints,
        impactWeighing: analysis.impactWeighing,
        timestamp: new Date(),
        transcript,
      };

      const updatedSession = {
        ...practiceSession,
        points: [...practiceSession.points, userPoint],
      };
      
      setPracticeSession(updatedSession);
      setTranscript('');
      setDuration(0);
      
      if (currentSpeech < 2) {
        setCurrentSpeech(currentSpeech + 1); // Move to next user speech
      } else {
        // Practice session complete - generate personalized feedback
        await generatePersonalizedFeedback(updatedSession);
      }
    } catch (error) {
      console.error('Error analyzing speech:', error);
      setError('Error analyzing speech. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generatePreviousSpeeches = async () => {
    if (!practiceSession) return;
    setIsAnalyzing(true);
    console.log('Starting generatePreviousSpeeches');
    try {
      // Generate speeches that come before the user's position
      const speechesToGenerate = [];
      
      if (userSpeakerNumber === 1) {
        setStep('practice');
        setIsAnalyzing(false);
        return;
      } else if (userSpeakerNumber === 2) {
        speechesToGenerate.push(
          { speechNumber: 1, team: 'affirmative', speakerName: `AI ${userTeam === 'affirmative' ? 'Affirmative' : 'Negative'} 1st` },
          { speechNumber: 2, team: 'negative', speakerName: `AI ${userTeam === 'affirmative' ? 'Negative' : 'Affirmative'} 1st` }
        );
      }

      const generatedPoints: DebatePoint[] = [];

      for (const speechInfo of speechesToGenerate) {
        try {
          console.log('Generating AI speech for', speechInfo);
          const aiSpeech = await generateAISpeech(speechInfo.speechNumber, speechInfo.team as 'affirmative' | 'negative');
          const aiPoint: DebatePoint = {
            id: (Date.now() + speechInfo.speechNumber).toString(),
            speakerId: `ai${speechInfo.speechNumber}`,
            speakerName: speechInfo.speakerName,
            team: speechInfo.team as 'affirmative' | 'negative',
            speechNumber: speechInfo.speechNumber,
            mainPoints: aiSpeech.mainPoints,
            counterPoints: aiSpeech.counterPoints,
            counterCounterPoints: aiSpeech.counterCounterPoints,
            impactWeighing: aiSpeech.impactWeighing,
            timestamp: new Date(),
            transcript: aiSpeech.transcript,
          };
          generatedPoints.push(aiPoint);
        } catch (err) {
          console.error('AI speech generation failed:', err);
          generatedPoints.push({
            id: (Date.now() + speechInfo.speechNumber).toString(),
            speakerId: `ai${speechInfo.speechNumber}`,
            speakerName: speechInfo.speakerName,
            team: speechInfo.team as 'affirmative' | 'negative',
            speechNumber: speechInfo.speechNumber,
            mainPoints: ['[Error generating speech]'],
            counterPoints: [],
            counterCounterPoints: [],
            impactWeighing: '[Error generating impact weighing]',
            timestamp: new Date(),
            transcript: '[Error generating transcript]'
          });
        }
      }

      const sessionWithPreviousSpeeches: DebateSession = {
        ...practiceSession,
        points: [...practiceSession.points, ...generatedPoints],
      };
      setPracticeSession(sessionWithPreviousSpeeches);
    } catch (error) {
      console.error('Error generating previous speeches:', error);
      setError('Error generating previous speeches. Please try again.');
    } finally {
      setIsAnalyzing(false);
      setStep('practice');
    }
  };

  const generateAISpeech = async (speechNumber: number, team: 'affirmative' | 'negative') => {
    console.log('Calling OpenAI for', speechNumber, team);
    const prompt = `You are an expert debater giving the ${speechNumber === 1 ? '1st' : '2nd'} ${team} speech in a practice debate.

Debate Topic: ${topic}

Generate a realistic ${speechNumber === 1 ? '1st' : '2nd'} ${team} speech that:
1. Presents strong arguments for the ${team} position
2. Establishes clear contentions and evidence
3. Maintains proper debate structure and flow
4. Is appropriate for a ${speechNumber === 1 ? '1st' : '2nd'} speaker
5. Provides arguments that a ${userSpeakerNumber === 1 ? '1st' : '2nd'} ${userTeam} speaker would need to respond to
6. ${userSpeakerNumber === 2 ? `Since the user is a 2nd ${userTeam} speaker, make sure this speech provides clear arguments they can rebut and extend` : ''}

The speech should be approximately 3-4 minutes long when spoken and include:
- Clear thesis and roadmap
- 2-3 main contentions with supporting evidence
- Impact analysis for each argument
- Proper debate terminology and structure

Respond in this exact JSON format:
{
  "transcript": "Full speech transcript here...",
  "mainPoints": ["point 1", "point 2", "point 3"],
  "counterPoints": ["counter point 1", "counter point 2"],
  "counterCounterPoints": ["response to counter 1"],
  "impactWeighing": "Analysis of argument significance and weight"
}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1500,
          temperature: 0.7
        })
      });
      console.log('OpenAI response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error('Failed to generate AI speech');
      }
      const data = await response.json();
      const content = data.choices[0].message.content;
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonContent = codeMatch[1];
        }
      }
      return JSON.parse(jsonContent);
    } catch (error) {
      console.error('Error generating AI speech:', error);
      throw error;
    }
  };

  const generatePersonalizedFeedback = async (session: DebateSession) => {
    try {
      const userSpeeches = session.points.filter((point: DebatePoint) => point.speakerId === 'user');
      
      const prompt = `You are an expert debate coach providing personalized feedback to a ${userSpeakerNumber === 1 ? '1st' : '2nd'} ${userTeam} speaker.

Debate Topic: ${topic}
Speaker: ${userName} (${userSpeakerNumber === 1 ? '1st' : '2nd'} ${userTeam})

User's Speeches:
${userSpeeches.map((speech: DebatePoint, index: number) => 
  `Speech ${index + 1}: ${speech.transcript}`
).join('\n\n')}

Provide personalized feedback in this exact JSON format:
{
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["improvement 1", "improvement 2", "improvement 3"],
  "specificAdvice": "Detailed advice for this speaker's position and team",
  "overallScore": 85,
  "summary": "Overall assessment of the practice session"
}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 800,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate feedback');
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      let jsonContent = content;
      if (content.includes('```json')) {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          jsonContent = jsonMatch[1];
        }
      } else if (content.includes('```')) {
        const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonContent = codeMatch[1];
        }
      }
      
      const feedback = JSON.parse(jsonContent);
      
      // Update session with feedback
      const finalSession = {
        ...session,
        feedback,
        endTime: new Date()
      };
      
      setPracticeSession(finalSession);
    } catch (error) {
      console.error('Error generating feedback:', error);
      setError('Error generating feedback. Please try again.');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup step
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Mode Selection</span>
          </button>

          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-12 h-12 text-green-600 mr-3" />
              <h1 className="text-4xl font-bold text-gray-800">Practice Mode</h1>
            </div>
            <p className="text-gray-600">Individual practice with AI opponents</p>
            
            {/* Free Rounds Status */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              {isAdmin ? (
                <div className="text-green-600 font-medium">
                  ✓ Admin Access - Unlimited Rounds
                </div>
              ) : (
                <div className="text-gray-700">
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

          <form onSubmit={handleStartPractice} className="space-y-6">
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debate Topic
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter the debate topic or resolution..."
                required
              />
            </div>

            {/* User Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Team
                </label>
                <select
                  value={userTeam}
                  onChange={(e) => setUserTeam(e.target.value as 'affirmative' | 'negative')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="affirmative">Affirmative</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Speaker Position
                </label>
                <select
                  value={userSpeakerNumber}
                  onChange={(e) => setUserSpeakerNumber(parseInt(e.target.value) as 1 | 2)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value={1}>1st Speaker</option>
                  <option value={2}>2nd Speaker</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Practice Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Generating step
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl text-center">
          <div className="flex items-center justify-center mb-6">
            <Target className="w-12 h-12 text-green-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Generating Previous Speeches</h1>
          </div>
          
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="text-blue-800 text-lg font-medium">AI is generating previous speeches...</span>
              </div>
              <p className="text-blue-700">
                Since you're a {userSpeakerNumber === 1 ? '1st' : '2nd'} speaker, we're generating the speeches that come before your position so you can see what arguments to rebut and extend.
              </p>
            </div>
            
            <div className="text-left bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">What's being generated:</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                {userSpeakerNumber === 2 && (
                  <>
                    <li>• 1st Affirmative speech</li>
                    <li>• 1st Negative speech</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Practice step
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <Target className="w-8 h-8 text-green-600 mr-3" />
                Practice Mode
              </h1>
              <p className="text-gray-600">
                Topic: {topic} | {userName} ({userSpeakerNumber === 1 ? '1st' : '2nd'} {userTeam})
              </p>
            </div>
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Mode Selection</span>
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Recording Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Your Speech {currentSpeech === 1 ? '1' : '2'}/2
                </h3>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    userTeam === 'affirmative' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {userTeam}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="font-medium text-gray-900">{userName}</span>
                </div>
                <p className="text-sm text-gray-500">
                  {userSpeakerNumber === 1 ? 'First' : 'Second'} {userTeam} speaker
                </p>
                {userSpeakerNumber === 2 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      💡 Check the table to see previous speeches you can rebut and extend
                    </p>
                  </div>
                )}
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
                        onClick={handleCompleteSpeech}
                        disabled={isAnalyzing}
                        className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isAnalyzing ? 'Analyzing...' : 'Complete Speech & Continue'}
                      </button>
                    )}
                  </div>
                )}

                {/* Analysis Status */}
                {isAnalyzing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 text-sm">AI is analyzing your speech...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Practice Flow Table */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Practice Session Flow
                </h3>
                <p className="text-sm text-gray-600">
                  {userSpeakerNumber === 2 
                    ? `Previous speeches (for context) and your ${userTeam} speeches`
                    : `Your ${userTeam} speeches and AI opponent responses`
                  }
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                        Analysis Type
                      </th>
                      {[1, 2, 3, 4].map((speechNum) => {
                        const speech = practiceSession?.points.find((p: DebatePoint) => p.speechNumber === speechNum);
                        const isUser = speech?.speakerId === 'user';
                        
                        return (
                          <th key={speechNum} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200 min-w-[200px]">
                            <div className="space-y-1">
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                isUser 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                Speech {speechNum}
                              </div>
                              <div className="text-xs font-medium text-gray-900">
                                {speech?.speakerName || 'Not recorded yet'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {speech?.team || 'Unknown Team'}
                              </div>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Main Points Row */}
                    <tr>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-blue-50 border-r border-gray-200">
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                          Main Points
                        </div>
                      </td>
                      {[1, 2, 3, 4].map((speechNum) => {
                        const speech = practiceSession?.points.find((p: DebatePoint) => p.speechNumber === speechNum);
                        return (
                          <td key={speechNum} className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 align-top">
                            {speech ? (
                              <div className="space-y-2">
                                {speech.mainPoints.map((point: string, index: number) => (
                                  <div key={index} className="text-sm bg-blue-50 rounded p-2">
                                    {point}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm italic">
                                Not recorded yet
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Counter Points Row */}
                    <tr>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-orange-50 border-r border-gray-200">
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                          Counter Points
                        </div>
                      </td>
                      {[1, 2, 3, 4].map((speechNum) => {
                        const speech = practiceSession?.points.find((p: DebatePoint) => p.speechNumber === speechNum);
                        return (
                          <td key={speechNum} className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 align-top">
                            {speech ? (
                              <div className="space-y-2">
                                {speech.counterPoints.map((point: string, index: number) => (
                                  <div key={index} className="text-sm bg-orange-50 rounded p-2">
                                    {point}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm italic">
                                Not recorded yet
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Impact Weighing Row */}
                    <tr>
                      <td className="px-4 py-4 text-sm font-medium text-gray-900 bg-yellow-50 border-r border-gray-200">
                        <div className="flex items-center">
                          <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                          Impact Weighing
                        </div>
                      </td>
                      {[1, 2, 3, 4].map((speechNum) => {
                        const speech = practiceSession?.points.find((p: DebatePoint) => p.speechNumber === speechNum);
                        return (
                          <td key={speechNum} className="px-4 py-4 text-sm text-gray-900 border-r border-gray-200 align-top">
                            {speech ? (
                              <div className="text-sm bg-yellow-50 rounded p-2">
                                {speech.impactWeighing}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm italic">
                                Not recorded yet
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Personalized Feedback */}
            {practiceSession?.feedback && (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Personalized Feedback</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-600 mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      {practiceSession.feedback.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-2">✓</span>
                          <span className="text-gray-700">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-orange-600 mb-3">Areas for Improvement</h4>
                    <ul className="space-y-2">
                      {practiceSession.feedback.areasForImprovement.map((improvement: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-orange-500 mr-2">→</span>
                          <span className="text-gray-700">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium text-blue-600 mb-3">Specific Advice</h4>
                  <p className="text-gray-700 bg-blue-50 rounded-lg p-4">
                    {practiceSession.feedback.specificAdvice}
                  </p>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Overall Score</h4>
                    <div className="text-3xl font-bold text-green-600">
                      {practiceSession.feedback.overallScore}/100
                    </div>
                  </div>
                  <button
                    onClick={onBack}
                    className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start New Practice Session
                  </button>
                </div>
                
                <div className="mt-4">
                  <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                  <p className="text-gray-700">
                    {practiceSession.feedback.summary}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PracticeMode; 