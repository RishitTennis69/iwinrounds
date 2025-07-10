import React, { useState } from 'react';
import { DebatePoint, Speaker } from '../types';
import { AIService } from '../utils/aiService';
import DebateFlowTable from './DebateFlowTable';
import RecordingPanel from './RecordingPanel';
import HintPanel from './HintPanel';
import { SpeechRecognitionService } from '../utils/speechRecognition';

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
  const [userSpeakerNumber, setUserSpeakerNumber] = useState<1 | 2>(1);
  const [userSpeeches, setUserSpeeches] = useState<{ [speechNum: number]: string }>({});
  const [aiSpeeches, setAiSpeeches] = useState<{ [speechNum: number]: DebatePoint }>({});
  const [currentSpeechIdx, setCurrentSpeechIdx] = useState(0);
  const [feedback, setFeedback] = useState<{ [speechNum: number]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [speechRecognition] = useState(() => new SpeechRecognitionService());
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentSummary, setCurrentSummary] = useState<{ mainPoints: string[]; counterPoints: string[]; counterCounterPoints: string[]; impactWeighing: string }>({ mainPoints: [], counterPoints: [], counterCounterPoints: [], impactWeighing: '' });
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Debate structure for 2v2, 2 speeches per speaker
  const peoplePerTeam = 2;
  const speechesPerSpeaker = 2;
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
        const prompt = `You are an expert debater. Write a realistic ${sp.team} speech for a practice debate.\nDebate Topic: ${topic}\nSpeaker: ${sp.team} ${sp.speakerNumber}\n\nRespond in this exact JSON format:\n{\n  "transcript": "Full speech transcript here...",\n  "mainPoints": ["point 1", "point 2", "point 3"],\n  "counterPoints": ["counter point 1", "counter point 2"],\n  "counterCounterPoints": ["response to counter 1"],\n  "impactWeighing": "Analysis of argument significance and weight"\n}`;
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
            mainPoints: aiSpeech.mainPoints,
            counterPoints: aiSpeech.counterPoints,
            counterCounterPoints: aiSpeech.counterCounterPoints,
            impactWeighing: aiSpeech.impactWeighing,
            timestamp: new Date(),
            transcript: aiSpeech.transcript,
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
            timestamp: new Date(),
            transcript: '[Error generating transcript]'
          };
        }
      }
    }
    setAiSpeeches(aiSpeechMap);
    setIsLoading(false);
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
      setCurrentSummary({ mainPoints: ['[Error summarizing]'], counterPoints: [], counterCounterPoints: [], impactWeighing: '' });
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
      const feedbackText = await AIService.generateSpeakerFeedback(
        userName,
        userTeam,
        topic,
        [currentTranscript]
      );
      setFeedback((prev) => ({ ...prev, [speechNum]: feedbackText }));
      setUserSpeeches({ ...userSpeeches, [speechNum]: currentSummary.mainPoints.join('\n') });
      // After user speech, simulate up to next user speech or end
      const nextUserSpeech = getNextUserSpeechNum(speechNum);
      const nextSimulateTo = nextUserSpeech ? nextUserSpeech : totalSpeeches + 1;
      setStep('generating');
      await generateAISpeechesUpTo(speechNum, nextSimulateTo);
      setCurrentTranscript('');
      setCurrentSummary({ mainPoints: [], counterPoints: [], counterCounterPoints: [], impactWeighing: '' });
      if (currentSpeechIdx < userSpeechNums.length - 1) {
        setCurrentSpeechIdx(currentSpeechIdx + 1);
        setStep('practice');
      } else {
        setStep('complete');
      }
    } catch (err) {
      setFeedback((prev) => ({ ...prev, [speechNum]: 'Error generating feedback.' }));
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
  const practiceSession = {
    id: 'practice',
    topic,
    speakers: debateOrder.map((sp) => ({
      ...sp,
      name: sp.team === userTeam && sp.speakerNumber === userSpeakerNumber ? userName : sp.name || `${sp.team.charAt(0).toUpperCase() + sp.team.slice(1)} ${sp.speakerNumber}`,
    })),
    points: Array.from({ length: totalSpeeches }, (_, i) => {
      const num = i + 1;
      if (userSpeechNums.includes(num)) {
        // User speech: show summary if submitted, else empty
        return userSpeeches[num]
          ? {
              id: `user-${num}`,
              speakerId: `user-${num}`,
              speakerName: userName,
              team: userTeam,
              speechNumber: num,
              mainPoints: userSpeeches[num].split('\n').filter(Boolean),
              counterPoints: [],
              counterCounterPoints: [],
              impactWeighing: '',
              timestamp: new Date(),
              transcript: userSpeeches[num],
            }
          : undefined;
      } else {
        // AI speech
        return aiSpeeches[num];
      }
    }).filter(Boolean),
    startTime: new Date(),
    hintsUsed: hintsUsed,
  };

  // Render setup
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl relative">
          <button onClick={onBack} className="absolute top-6 left-6 flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors">
            Back
          </button>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800">Practice Mode</h1>
            <p className="text-gray-600">Practice with AI-generated notes for previous speeches</p>
          </div>
          <form onSubmit={handleStart} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Debate Topic</label>
              <textarea value={topic} onChange={e => setTopic(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none" rows={3} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <input type="text" value={userName} onChange={e => setUserName(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Team</label>
                <select value={userTeam} onChange={e => setUserTeam(e.target.value as 'affirmative' | 'negative')} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value="affirmative">Affirmative</option>
                  <option value="negative">Negative</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Speaker Position</label>
                <select value={userSpeakerNumber} onChange={e => setUserSpeakerNumber(Number(e.target.value) as 1 | 2)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option value={1}>1st Speaker</option>
                  <option value={2}>2nd Speaker</option>
                </select>
              </div>
            </div>
            <button type="submit" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105">Start Practice</button>
          </form>
        </div>
      </div>
    );
  }

  if (step === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <div className="text-lg text-green-700">Generating AI speeches for the round...</div>
        </div>
      </div>
    );
  }

  // Practice step
  if (step === 'practice') {
    const speechNum = userSpeechNums[currentSpeechIdx];
    const currentSpeaker = {
      id: `user-${speechNum}`,
      name: userName,
      team: userTeam,
      points: 0,
      speakerNumber: userSpeakerNumber,
    };
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-5xl">
          <button onClick={onBack} className="mb-4 text-gray-600 hover:text-gray-800">Back</button>
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Practice Speech {currentSpeechIdx + 1} of {userSpeechNums.length}</h2>
            <p className="text-gray-600 mb-2">Topic: <span className="font-semibold">{topic}</span></p>
            <p className="text-gray-600 mb-2">Your Position: <span className="font-semibold">{userSpeakerNumber === 1 ? '1st' : '2nd'} {userTeam.charAt(0).toUpperCase() + userTeam.slice(1)}</span></p>
          </div>
          {/* Debate Flow Table (summary only) */}
          <div className="mb-8">
            <DebateFlowTable session={practiceSession as any} peoplePerTeam={peoplePerTeam} speechesPerSpeaker={speechesPerSpeaker} />
          </div>
          {/* Recording and Hints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="md:col-span-2">
              <RecordingPanel
                currentSpeaker={currentSpeaker}
                speechNumber={speechNum}
                onSpeechComplete={handleSpeechComplete}
                speechRecognition={speechRecognition}
                isAnalyzing={isSummarizing}
              />
            </div>
            <div>
              <HintPanel
                currentSpeaker={currentSpeaker}
                session={practiceSession as any}
                hintsUsed={hintsUsed}
                onHintUsed={handleHintUsed}
              />
            </div>
          </div>
          {/* After recording, show summary editor */}
          {currentTranscript && (
            <form onSubmit={handleSubmitSummary} className="space-y-4 max-w-2xl mx-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Edit AI Summary (main points, one per line)</label>
                <textarea
                  value={currentSummary.mainPoints.join('\n')}
                  onChange={e => setCurrentSummary({ ...currentSummary, mainPoints: e.target.value.split('\n') })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  rows={5}
                  required
                />
              </div>
              <button type="submit" className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:bg-green-700 transition-all duration-200" disabled={isLoading}>{isLoading ? 'Analyzing...' : 'Submit for Feedback'}</button>
              {feedback[speechNum] && (
                <div className="mt-6 bg-green-50 rounded-lg p-4 text-green-800">
                  <h4 className="font-semibold mb-2">Personalized Feedback</h4>
                  <div>{feedback[speechNum]}</div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    );
  }

  // Complete step
  if (step === 'complete') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Practice Complete!</h2>
          <p className="text-green-700 mb-6">You have completed your practice speeches. Review your feedback above and try again to improve!</p>
          <button onClick={onBack} className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">Back to Mode Selection</button>
        </div>
      </div>
    );
  }

  return null;
};

export default PracticeMode; 