import React, { useState } from 'react';
import { DebatePoint, Speaker } from '../types';
import { AIService } from '../utils/aiService';
import DebateFlowTable from './DebateFlowTable';
import RecordingPanel from './RecordingPanel';
import HintPanel from './HintPanel';
import { WhisperService } from '../utils/whisperService';
import { TTSService } from '../utils/ttsService';
import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface PracticeModeProps {
  onBack: () => void;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ onBack }) => {
  const [step, setStep] = useState<'setup' | 'generating' | 'practice' | 'complete'>('setup');
  const [topic, setTopic] = useState('');
  const [userName, setUserName] = useState('');
  const [userTeam, setUserTeam] = useState<'affirmative' | 'negative'>('affirmative');
  const [userSpeakerNumber, setUserSpeakerNumber] = useState(1);
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);
  const [userSpeeches, setUserSpeeches] = useState<{ [speechNum: number]: string }>({});
  const [aiSpeeches, setAiSpeeches] = useState<{ [speechNum: number]: DebatePoint }>({});
  const [currentSpeechIdx, setCurrentSpeechIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [whisperService] = useState(() => new WhisperService());
  const [ttsService] = useState(() => new TTSService());
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentSummary, setCurrentSummary] = useState<{ mainPoints: string[]; counterPoints: string[]; counterCounterPoints: string[]; impactWeighing: string; evidence: string[] }>({ mainPoints: [], counterPoints: [], counterCounterPoints: [], impactWeighing: '', evidence: [] });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isPlayingAI, setIsPlayingAI] = useState(false);
  const [currentPlayingSpeech, setCurrentPlayingSpeech] = useState<number | null>(null);

  // Reset userSpeakerNumber when peoplePerTeam changes
  useEffect(() => {
    if (userSpeakerNumber > peoplePerTeam) {
      setUserSpeakerNumber(1);
    }
  }, [peoplePerTeam, userSpeakerNumber]);

  // Debate structure - now configurable
  const totalSpeeches = peoplePerTeam * 2 * speechesPerSpeaker;
  // Debate order: [Aff1, Neg1, Aff2, Neg2] repeated
  const speakerOrder: Speaker[] = [];
  for (let i = 0; i < peoplePerTeam; i++) {
    speakerOrder.push({ id: `aff${i+1}`, name: '', team: 'affirmative', points: 0, speakerNumber: i+1 });
    speakerOrder.push({ id: `neg${i+1}`, name: '', team: 'negative', points: 0, speakerNumber: i+1 });
  }
  const debateOrder: Speaker[] = [];
  for (let i = 0; i < speechesPerSpeaker; i++) {
    for (let j = 0; j < speakerOrder.length; j++) {
      debateOrder.push(speakerOrder[j]);
    }
  }
  // Find which speeches are the user's
  const userSpeechNums = debateOrder
    .map((sp, idx) =>
      sp.team === userTeam && sp.speakerNumber === userSpeakerNumber ? idx + 1 : null
    )
    .filter((n) => n !== null) as number[];

  // Helper: get the next user speech number after a given speech
  const getNextUserSpeechNum = (after: number) => {
    return userSpeechNums.find(num => num > after);
  };

  // Generate AI speeches up to (but not including) the next user speech
  const generateAISpeechesUpTo = async (from: number, to: number) => {
    setIsLoading(true);
    const aiSpeechMap = { ...aiSpeeches };
    for (let i = from + 1; i < to; i++) {
      if (!userSpeechNums.includes(i) && !aiSpeechMap[i]) {
        const sp = debateOrder[i - 1];
        const prompt = `You are an expert debater. Write a realistic ${sp.team} speech for a practice debate.\nDebate Topic: ${topic}\nSpeaker: ${sp.team} ${sp.speakerNumber}\n\nRespond in this exact JSON format:\n{\n  "transcript": "Full speech transcript here...",\n  "mainPoints": ["point 1", "point 2", "point 3"],\n  "counterPoints": ["counter point 1", "counter point 2"],\n  "counterCounterPoints": ["response to counter 1"],\n  "impactWeighing": "Analysis of argument significance and weight",\n  "evidence": ["fact/statistic/quote with source", "another piece of evidence"]\n}`;
        try {
          const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
            },
            body: JSON.stringify({
              model: 'gpt-4.1-nano',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 1000,
              temperature: 0.7
            })
          });
          if (!response.ok) throw new Error('Failed to generate AI speech');
          const data = await response.json();
          let content = data.choices[0].message.content;
          if (content.includes('```json')) {
            const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) content = jsonMatch[1];
          } else if (content.includes('```')) {
            const codeMatch = content.match(/```\s*([\s\S]*?)\s*```/);
            if (codeMatch) content = codeMatch[1];
          }
          const aiSpeech = JSON.parse(content);
          aiSpeechMap[i] = {
            id: `ai-${i}`,
            speakerId: `ai-${i}`,
            speakerName: `${sp.team.charAt(0).toUpperCase() + sp.team.slice(1)} ${sp.speakerNumber}`,
            team: sp.team,
            speechNumber: i,
            mainPoints: aiSpeech.mainPoints || [],
            counterPoints: aiSpeech.counterPoints || [],
            counterCounterPoints: aiSpeech.counterCounterPoints || [],
            impactWeighing: aiSpeech.impactWeighing || 'No impact weighing provided',
            evidence: aiSpeech.evidence || [],
            timestamp: new Date(),
            transcript: aiSpeech.transcript || '[No transcript provided]',
          };
        } catch (err) {
          aiSpeechMap[i] = {
            id: `ai-${i}`,
            speakerId: `ai-${i}`,
            speakerName: `${sp.team.charAt(0).toUpperCase() + sp.team.slice(1)} ${sp.speakerNumber}`,
            team: sp.team,
            speechNumber: i,
            mainPoints: ['[Error generating speech]'],
            counterPoints: [],
            counterCounterPoints: [],
            impactWeighing: '[Error generating impact weighing]',
            evidence: [],
            timestamp: new Date(),
            transcript: '[Error generating transcript]'
          };
        }
      }
    }
    setAiSpeeches(aiSpeechMap);
    setIsLoading(false);
  };

  // Play AI speech using TTS
  const playAISpeech = async (speechNum: number) => {
    const speech = aiSpeeches[speechNum];
    if (!speech || !speech.transcript) return;

    try {
      setIsPlayingAI(true);
      setCurrentPlayingSpeech(speechNum);
      
      // Choose voice based on team (male voices for affirmative, female for negative)
      const voice = speech.team === 'affirmative' ? 'echo' : 'nova';
      
      await ttsService.speak(speech.transcript, { voice, speed: 0.9 });
    } catch (error) {
      console.error('Error playing AI speech:', error);
    } finally {
      setIsPlayingAI(false);
      setCurrentPlayingSpeech(null);
    }
  };

  // Stop AI speech
  const stopAISpeech = () => {
    ttsService.stop();
    setIsPlayingAI(false);
    setCurrentPlayingSpeech(null);
  };

  // On start, simulate up to the user's first speech
  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setStep('generating');
    const firstUserSpeech = userSpeechNums[0];
    await generateAISpeechesUpTo(0, firstUserSpeech);
    setStep('practice');
  };

  // Handler for when user completes recording
  const handleSpeechComplete = async (transcript: string) => {
    setCurrentTranscript(transcript);
    setIsSummarizing(true);
    try {
      const summary = await AIService.summarizeSpeech(transcript);
      setCurrentSummary(summary);
    } catch (err) {
      setCurrentSummary({ mainPoints: ['[Error summarizing]'], counterPoints: [], counterCounterPoints: [], impactWeighing: '', evidence: [] });
    } finally {
      setIsSummarizing(false);
    }
  };

  // Handler for submitting the summary for feedback
  const handleSubmitSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const speechNum = userSpeechNums[currentSpeechIdx];
    try {
      setUserSpeeches({ ...userSpeeches, [speechNum]: currentSummary.mainPoints.join('\n') });
      // After user speech, simulate up to next user speech or end
      const nextUserSpeech = getNextUserSpeechNum(speechNum);
      const nextSimulateTo = nextUserSpeech ? nextUserSpeech : totalSpeeches + 1;
      setStep('generating');
      await generateAISpeechesUpTo(speechNum, nextSimulateTo);
      setCurrentTranscript('');
      setCurrentSummary({ mainPoints: [], counterPoints: [], counterCounterPoints: [], impactWeighing: '', evidence: [] });
      if (currentSpeechIdx < userSpeechNums.length - 1) {
        setCurrentSpeechIdx(currentSpeechIdx + 1);
        setStep('practice');
      } else {
        setStep('complete');
      }
    } catch (err) {
      setUserSpeeches((prev) => ({ ...prev, [speechNum]: 'Error generating feedback.' }));
      setStep('practice');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for hints
  const handleHintUsed = () => {
    setHintsUsed(h => h + 1);
  };

  // Compose a DebateSession for the table
  const composeSession = () => {
    const points: DebatePoint[] = [];
    
    // Add user speeches
    Object.entries(userSpeeches).forEach(([speechNum, summary]) => {
      const num = parseInt(speechNum);
      points.push({
        id: `user-${num}`,
        speakerId: `user-${num}`,
        speakerName: userName,
        team: userTeam,
        speechNumber: num,
        mainPoints: summary.split('\n'),
        counterPoints: [],
        counterCounterPoints: [],
        impactWeighing: '',
        evidence: [],
        timestamp: new Date(),
        transcript: currentTranscript
      });
    });
    
    // Add AI speeches
    Object.values(aiSpeeches).forEach(speech => {
      points.push(speech);
    });
    
    // Create speakers array
    const speakers: Speaker[] = debateOrder.map((sp) => ({
      ...sp,
      name: sp.team === userTeam && sp.speakerNumber === userSpeakerNumber ? userName : sp.name || `${sp.team.charAt(0).toUpperCase() + sp.team.slice(1)} ${sp.speakerNumber}`,
    }));
    
    return {
      id: 'practice-session',
      topic,
      speakers,
      points: points.sort((a, b) => a.speechNumber - b.speechNumber),
      startTime: new Date(),
      hintsUsed,
      firstSpeaker: 'affirmative' as const
    };
  };

  // Get current speaker for recording
  const getCurrentSpeaker = (): Speaker | null => {
    const speechNum = userSpeechNums[currentSpeechIdx];
    if (!speechNum) return null;
    
    const sp = debateOrder[speechNum - 1];
    return {
      ...sp,
      name: userName
    };
  };

  // Get AI speeches to display
  const getAISpeechesToShow = () => {
    const currentUserSpeech = userSpeechNums[currentSpeechIdx];
    if (!currentUserSpeech) return [];
    
    return Object.values(aiSpeeches)
      .filter(speech => speech.speechNumber < currentUserSpeech)
      .sort((a, b) => a.speechNumber - b.speechNumber);
  };

  // Create a mock session for HintPanel
  const createMockSession = () => {
    return {
      topic,
      points: Object.values(aiSpeeches).sort((a, b) => a.speechNumber - b.speechNumber)
    };
  };

  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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
            <h1 className="text-4xl font-bold text-gray-800 mb-2">ReasynAI</h1>
            <p className="text-gray-600">Your Personal AI Coach That Fits in Your Pocket</p>
            <p className="text-blue-600 font-medium mt-2">Practice Mode Setup</p>
          </div>

          <form onSubmit={handleStart} className="space-y-6">
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debate Topic
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter the debate topic or resolution..."
                required
              />
            </div>

            {/* Your Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Customization fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">People per Team</label>
                <select
                  value={peoplePerTeam}
                  onChange={(e) => setPeoplePerTeam(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={1}>1 (1v1)</option>
                  <option value={2}>2 (2v2)</option>
                  <option value={3}>3 (3v3)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Speeches per Speaker</label>
                <select
                  value={speechesPerSpeaker}
                  onChange={(e) => setSpeechesPerSpeaker(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={4}>4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Team</label>
                <select
                  value={userTeam}
                  onChange={(e) => setUserTeam(e.target.value as 'affirmative' | 'negative')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="affirmative">Affirmative</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
            </div>

            {/* Your Speaker Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Your Speaker Number</label>
              <div className="grid grid-cols-3 gap-3">
                {Array.from({ length: peoplePerTeam }, (_, i) => (
                  <label key={i + 1} className="flex items-center justify-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-all duration-200">
                    <input
                      type="radio"
                      name="speaker"
                      value={i + 1}
                      checked={userSpeakerNumber === i + 1}
                      onChange={(e) => setUserSpeakerNumber(parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${
                      userSpeakerNumber === i + 1 
                        ? 'border-blue-600 bg-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {userSpeakerNumber === i + 1 && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium text-gray-900">Speaker {i + 1}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Debate Structure Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Practice Session Overview</h3>
              {peoplePerTeam === 1 ? (
                <div className="text-center">
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">1v1 Practice Format</h4>
                    <p className="text-sm text-blue-700">
                      You will practice against an AI opponent in a direct 1v1 debate.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-green-600 font-semibold">You</span>
                      </div>
                      <p className="text-sm text-gray-600">{userTeam.charAt(0).toUpperCase() + userTeam.slice(1)}</p>
                      <p className="text-xs text-gray-500">{speechesPerSpeaker} speech{speechesPerSpeaker > 1 ? 'es' : ''}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <span className="text-red-600 font-semibold">AI</span>
                      </div>
                      <p className="text-sm text-gray-600">{userTeam === 'affirmative' ? 'Negative' : 'Affirmative'}</p>
                      <p className="text-xs text-gray-500">{speechesPerSpeaker} speech{speechesPerSpeaker > 1 ? 'es' : ''}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-blue-600 mb-2">Affirmative Team</h4>
                    <div className="space-y-1">
                      {Array.from({ length: peoplePerTeam }, (_, i) => (
                        <div key={i} className="text-sm text-gray-600">
                          Speaker {i + 1}: {speechesPerSpeaker} speech{speechesPerSpeaker > 1 ? 'es' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">Negative Team</h4>
                    <div className="space-y-1">
                      {Array.from({ length: peoplePerTeam }, (_, i) => (
                        <div key={i} className="text-sm text-gray-600">
                          Speaker {i + 1}: {speechesPerSpeaker} speech{speechesPerSpeaker > 1 ? 'es' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Your role:</strong> {userTeam.charAt(0).toUpperCase() + userTeam.slice(1)} Speaker {userSpeakerNumber} 
                  ({userSpeechNums.length} speech{userSpeechNums.length > 1 ? 'es' : ''})
                </p>
              </div>
              <div className="text-xs text-gray-500 mt-2 text-center">
                Total speeches in this practice session: {totalSpeeches}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Practice Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            {/* Animated Loading */}
            <div className="mb-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-blue-200 rounded-full mx-auto"></div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-20 h-20 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Preparing Your Debate</h2>
            <p className="text-gray-600 mb-6">Our AI is generating realistic speeches for the other debaters...</p>
            
            {/* Progress Steps */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                  ✓
                </div>
                <span className="text-sm text-gray-700">Analyzing debate topic</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">
                  ✓
                </div>
                <span className="text-sm text-gray-700">Setting up debate structure</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs animate-pulse">
                  ⚡
                </div>
                <span className="text-sm text-gray-700">Generating AI speeches</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-xs">
                  ⏳
                </div>
                <span className="text-sm text-gray-500">Preparing practice environment</span>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> This usually takes 10-30 seconds depending on the debate format.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice Complete!</h2>
          <DebateFlowTable 
            session={composeSession()} 
            peoplePerTeam={peoplePerTeam}
            speechesPerSpeaker={speechesPerSpeaker}
          />
          <div className="mt-6 flex justify-center">
            <button
              onClick={onBack}
              className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - AI Speeches */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Speeches</h3>
            <div className="space-y-3">
              {getAISpeechesToShow().map((speech) => (
                <div key={speech.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      speech.team === 'affirmative' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {speech.team}
                    </span>
                    <span className="text-sm text-gray-500">Speech {speech.speechNumber}</span>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                    {speech.transcript.substring(0, 100)}...
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => playAISpeech(speech.speechNumber)}
                      disabled={isPlayingAI}
                      className="flex-1 bg-blue-600 text-white py-1 px-2 rounded text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {currentPlayingSpeech === speech.speechNumber ? 'Playing...' : 'Listen'}
                    </button>
                    {isPlayingAI && currentPlayingSpeech === speech.speechNumber && (
                      <button
                        onClick={stopAISpeech}
                        className="bg-red-600 text-white py-1 px-2 rounded text-xs hover:bg-red-700 transition-colors"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column - Recording */}
        <div className="lg:col-span-1">
          <RecordingPanel
            currentSpeaker={getCurrentSpeaker()}
            speechNumber={userSpeechNums[currentSpeechIdx]}
            totalSpeeches={totalSpeeches}
            onSpeechComplete={handleSpeechComplete}
            speechRecognition={whisperService}
            isAnalyzing={isSummarizing}
          />
        </div>

        {/* Right Column - Analysis & Hints */}
        <div className="lg:col-span-1 space-y-4">
          {currentTranscript && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Speech Analysis</h3>
              {isSummarizing ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Analyzing speech...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentSummary.mainPoints.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Main Points:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {currentSummary.mainPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {currentSummary.counterPoints.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Counter Points:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {currentSummary.counterPoints.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {currentSummary.evidence.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Evidence:</h4>
                      <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                        {currentSummary.evidence.map((evidence, idx) => (
                          <li key={idx}>{evidence}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmitSummary}>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isLoading ? 'Processing...' : 'Submit & Continue'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          <HintPanel
            currentSpeaker={getCurrentSpeaker()!}
            session={createMockSession()}
            onHintUsed={handleHintUsed}
            hintsUsed={hintsUsed}
          />
        </div>
      </div>

      {/* Debate Flow Table Summary */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Debate Flow Summary</h3>
        <DebateFlowTable 
          session={composeSession()} 
          peoplePerTeam={peoplePerTeam}
          speechesPerSpeaker={speechesPerSpeaker}
        />
      </div>
    </div>
  );
};

export default PracticeMode; 