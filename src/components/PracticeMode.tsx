import React, { useState } from 'react';
import { DebatePoint, Speaker } from '../types';
import { AIService } from '../utils/aiService';
import DebateFlowTable from './DebateFlowTable';
import RecordingPanel from './RecordingPanel';
import HintPanel from './HintPanel';
import { WhisperService } from '../utils/whisperService';
import { TTSService } from '../utils/ttsService';
import { useEffect } from 'react';

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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice Mode Setup</h2>
          
          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debate Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter the debate topic..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Enter your name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="affirmative">Affirmative</option>
                <option value="negative">Negative</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                People per Team
              </label>
              <select
                value={peoplePerTeam}
                onChange={(e) => setPeoplePerTeam(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={2}>2 people per team</option>
                <option value={3}>3 people per team</option>
                <option value={4}>4 people per team</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Speaker Number
              </label>
              <select
                value={userSpeakerNumber}
                onChange={(e) => setUserSpeakerNumber(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: peoplePerTeam }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Speaker {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speeches per Speaker
              </label>
              <select
                value={speechesPerSpeaker}
                onChange={(e) => setSpeechesPerSpeaker(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 speech per speaker</option>
                <option value={2}>2 speeches per speaker</option>
                <option value={3}>3 speeches per speaker</option>
              </select>
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onBack}
                className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Practice
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating AI Speeches</h2>
          <p className="text-gray-600">Please wait while the AI generates speeches for the other debaters...</p>
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