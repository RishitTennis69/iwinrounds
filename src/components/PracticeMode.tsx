import React, { useState, useEffect } from 'react';
import { Speaker, DebatePoint, DebateSession } from '../types';
import { WhisperService } from '../utils/whisperService';
import { AIService } from '../utils/aiService';
import { TTSService } from '../utils/ttsService';
import RecordingPanel from './RecordingPanel';
import DebateFlowTable from './DebateFlowTable';
import HintPanel from './HintPanel';
import RandomTopicSelector from './RandomTopicSelector';
import FinalAnalysis from './FinalAnalysis';
import PrepTime from './PrepTime';
import { ArrowLeft } from 'lucide-react';

interface PracticeModeProps {
  onBack: () => void;
  selectedFormat?: any;
  freeRoundsUsed?: number;
  isAdmin?: boolean;
}

const PracticeMode: React.FC<PracticeModeProps> = ({ onBack, selectedFormat: initialFormat }) => {
  console.log('🔍 PracticeMode: Component rendering');
  console.log('🔍 PracticeMode: initialFormat received:', initialFormat);
  
  const [step, setStep] = useState<'format' | 'setup' | 'prep' | 'generating' | 'practice' | 'complete'>('format');
  const [selectedFormat, setSelectedFormat] = useState<any>(initialFormat || null);
  const [topic, setTopic] = useState('');
  const [userName, setUserName] = useState(() => {
    // Load username from sessionStorage on component mount
    return sessionStorage.getItem('reasynai_user_name') || '';
  });
  const [userTeam, setUserTeam] = useState<'affirmative' | 'negative'>('affirmative');
  const [firstSpeaker, setFirstSpeaker] = useState<'affirmative' | 'negative'>('affirmative');
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);
  const [userSpeakerNumber, setUserSpeakerNumber] = useState(1);
  const [userSpeeches, setUserSpeeches] = useState<{ [speechNum: number]: string }>({});
  const [aiSpeeches, setAiSpeeches] = useState<{ [speechNum: number]: DebatePoint }>({});
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [whisperService] = useState(() => new WhisperService());
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [currentSummary, setCurrentSummary] = useState<{ mainPoints: string[]; counterPoints: string[]; counterCounterPoints: string[]; impactWeighing: string; evidence: string[] }>({ mainPoints: [], counterPoints: [], counterCounterPoints: [], impactWeighing: '', evidence: [] });
  const [hintsUsed, setHintsUsed] = useState(0);
  const [listenedSpeeches, setListenedSpeeches] = useState<Set<number>>(new Set());
  const [requiredSpeechToListen, setRequiredSpeechToListen] = useState<number | null>(null);
  const [speechPlayStates, setSpeechPlayStates] = useState<{[key: number]: 'idle' | 'playing' | 'paused' | 'completed'}>({});
  const [speechLoadingStates, setSpeechLoadingStates] = useState<{[key: number]: boolean}>({});
  const [speechIntervals, setSpeechIntervals] = useState<{[key: number]: number | undefined}>({});
  const [speechTimers, setSpeechTimers] = useState<{[key: number]: number}>({});
  const [userFeedback, setUserFeedback] = useState<{
    strengths: string[];
    areasForImprovement: string[];
    overallAssessment: string;
  } | null>(null);
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [flowChartSpeeches, setFlowChartSpeeches] = useState<{ [speechNum: number]: DebatePoint }>({});
  const [currentSpeechIdx, setCurrentSpeechIdx] = useState(0);
  const [ttsService] = useState(() => new TTSService());
  const [isLoading, setIsLoading] = useState(false);
  const [prepTimeUsed, setPrepTimeUsed] = useState(0);
  const [selectedFormatData, setSelectedFormatData] = useState<any>(null);
  const [prepTime, setPrepTime] = useState(0);

  console.log('🔍 PracticeMode: Initial step state:', step);
  console.log('🔍 PracticeMode: Initial selectedFormat state:', selectedFormat);

  // Initialize format from props
  useEffect(() => {
    console.log('🔍 PracticeMode: useEffect triggered with initialFormat:', initialFormat);
    if (initialFormat) {
      console.log('🔍 PracticeMode: initialFormat is truthy, setting up format');
      setSelectedFormat(initialFormat);
      setSelectedFormatData(initialFormat);
      setPeoplePerTeam(initialFormat.peoplePerTeam);
      setSpeechesPerSpeaker(initialFormat.speechesPerSpeaker);
      setFirstSpeaker(initialFormat.firstSpeaker);
      setStep('setup');
      console.log('🔍 PracticeMode: Set step to setup');
    } else {
      console.log('🔍 PracticeMode: initialFormat is null/undefined (navigating from dashboard or custom format)');
      // Always show format selection first, regardless of initialFormat value
      setSelectedFormat(null);
      setSelectedFormatData(null);
      setStep('format');
      console.log('🔍 PracticeMode: Set step to format for format selection');
    }
  }, [initialFormat]);

  // Debate formats for practice mode
  const DEBATE_FORMATS = [
    {
      name: 'Public Forum',
      description: '2v2 format with constructive speeches and rebuttals',
      peoplePerTeam: 2,
      speechesPerSpeaker: 2,
      firstSpeaker: 'affirmative' as const,
      icon: '🏛️',
      prepTime: 3,
      prepTimeType: 'flexible' as const
    },
    {
      name: 'Lincoln Douglas',
      description: '1v1 value debate format with multiple speeches per speaker',
      peoplePerTeam: 1,
      speechesPerSpeaker: 3,
      firstSpeaker: 'affirmative' as const,
      icon: '⚖️',
      prepTime: 4,
      prepTimeType: 'flexible' as const
    },
    {
      name: 'Policy Debate',
      description: '2v2 format with constructives and rebuttals',
      peoplePerTeam: 2,
      speechesPerSpeaker: 4,
      firstSpeaker: 'affirmative' as const,
      icon: '📋',
      prepTime: 8,
      prepTimeType: 'flexible' as const
    },
    {
      name: 'Parliamentary',
      description: '2v2 Government vs Opposition format',
      peoplePerTeam: 2,
      speechesPerSpeaker: 1,
      firstSpeaker: 'affirmative' as const,
      icon: '🏛️',
      prepTime: 20,
      prepTimeType: 'pre-round' as const
    },
    {
      name: 'Spar Debate',
      description: '1v1 short format with quick constructive and rebuttal rounds',
      peoplePerTeam: 1,
      speechesPerSpeaker: 2,
      firstSpeaker: 'affirmative' as const,
      icon: '⚡',
      prepTime: 2,
      prepTimeType: 'pre-round' as const
    }
  ];

  const handleFormatSelect = (format: typeof DEBATE_FORMATS[0] | null) => {
    if (format) {
      setSelectedFormat(format);
      setPeoplePerTeam(format.peoplePerTeam);
      setSpeechesPerSpeaker(format.speechesPerSpeaker);
      setFirstSpeaker(format.firstSpeaker);
      setSelectedFormatData(format);
    } else {
      setSelectedFormat('');
      setSelectedFormatData(null);
    }
    setStep('setup');
  };

  useEffect(() => {
    if (userName) {
      sessionStorage.setItem('reasynai_user_name', userName);
    }
  }, [userName]);

  // Clear sessionStorage when component unmounts or user goes back
  useEffect(() => {
    return () => {
      // Only clear if we're actually leaving the practice mode
      if (step === 'setup') {
        sessionStorage.removeItem('reasynai_user_name');
      }
    };
  }, [step]);

  // Calculate user's team based on speaker number and first speaker
  const getUserTeam = (): 'affirmative' | 'negative' => {
    return userTeam;
  };

  // Reset userSpeakerNumber when peoplePerTeam changes
  useEffect(() => {
    if (userSpeakerNumber > peoplePerTeam * 2) {
      setUserSpeakerNumber(1);
    }
  }, [peoplePerTeam, userSpeakerNumber]);

  // Debate structure - now configurable
  const totalSpeeches = peoplePerTeam * 2 * speechesPerSpeaker;
  
  // Create debate order based on first speaker and people per team
  const createDebateOrderForPractice = (): Speaker[] => {
    const aff = Array.from({ length: peoplePerTeam }, (_, i) => ({
      id: `aff${i+1}`,
      name: '',
      team: 'affirmative' as const,
      points: 0,
      speakerNumber: i+1
    }));
    const neg = Array.from({ length: peoplePerTeam }, (_, i) => ({
      id: `neg${i+1}`,
      name: '',
      team: 'negative' as const,
      points: 0,
      speakerNumber: i+1
    }));
    
    const sequence: Speaker[] = [];
    // Create sequence based on first speaker
    if (firstSpeaker === 'affirmative') {
      for (let i = 0; i < peoplePerTeam; i++) {
        sequence.push(aff[i]);
        sequence.push(neg[i]);
      }
    } else {
      for (let i = 0; i < peoplePerTeam; i++) {
        sequence.push(neg[i]);
        sequence.push(aff[i]);
      }
    }
    
    // Repeat the sequence for speeches per speaker
    const debateOrder: Speaker[] = [];
    for (let i = 0; i < speechesPerSpeaker; i++) {
      for (let j = 0; j < sequence.length; j++) {
        debateOrder.push(sequence[j]);
      }
    }
    return debateOrder;
  };
  
  const debateOrder = createDebateOrderForPractice();
  
  // Find which speeches are the user's
  const calculateUserSpeechPosition = () => {
    // Use the selected team and speaker number
    let targetTeam: 'affirmative' | 'negative' = userTeam;
    let positionInTeam: number = userSpeakerNumber;
    
    return { targetTeam, positionInTeam };
  };
  
  const { targetTeam, positionInTeam } = calculateUserSpeechPosition();
  const userSpeechNums = debateOrder
    .map((sp, idx) => {
      const isUserSpeech = sp.team === targetTeam && sp.speakerNumber === positionInTeam;
      return isUserSpeech ? idx + 1 : null;
    })
    .filter((n) => n !== null) as number[];

  console.log('First user speech:', userSpeechNums[0]);
  console.log('User speech numbers:', userSpeechNums);
  console.log('User team:', targetTeam, 'Position in team:', positionInTeam);
  console.log('Debate order:', debateOrder.map((s, i) => `${i+1}: ${s.team} ${s.speakerNumber}`));

  // Helper: get the next user speech number after a given speech
  const getNextUserSpeechNum = (after: number) => {
    return userSpeechNums.find(num => num > after);
  };

  // Generate AI speeches up to (but not including) the next user speech
  const generateAISpeechesUpTo = async (from: number, to: number) => {
    setIsLoading(true);
    console.log(`Generating AI speeches from ${from} to ${to}`);
    const aiSpeechMap = { ...aiSpeeches };
    // Start from 1 if from is 0, otherwise from + 1
    const startFrom = from === 0 ? 1 : from + 1;
    console.log(`Starting from speech ${startFrom}, going to ${to}`);
    for (let i = startFrom; i < to; i++) {
      console.log(`Checking speech ${i}: userSpeechNums includes ${i}?`, userSpeechNums.includes(i));
      console.log(`Already have aiSpeech for ${i}?`, !!aiSpeechMap[i]);
      if (!userSpeechNums.includes(i) && !aiSpeechMap[i]) {
        console.log(`Generating AI speech for speech ${i}`);
        const sp = debateOrder[i - 1];
        const prompt = `You are an expert debater. Write a realistic ${sp.team} speech for a practice debate following this exact structure:

**TOPIC:** ${topic}
**SPEAKER:** ${sp.team} ${sp.speakerNumber}

**STRUCTURE:**
1. **Intro:**
   - AGD (Attention-Grabbing Device)
   - Link to Topic
   - Background
   - Statement of Significance (why this topic matters)
   - Resolution
   - Side (${sp.team})
   - Preview (1-2 main contentions)

2. **Contentions (1-2 main arguments):**
   - Claim
   - Why Claim is True (Reasoning + Evidence)
   - Impact

3. **Conclusion:**
   - Summarize main points
   - Weighing ("our world vs their world")
   - Zinger (memorable closing)

**IMPORTANT LANGUAGE GUIDELINES:**
- DO NOT use "this house" or "This House" in the topic sentence or resolution
- Instead, use direct language like "we believe", "the United States should", "our team supports", etc.
- Make the language natural and direct, not parliamentary debate style

Write the speech in natural, flowing language that sounds like a real debate speech. Make it approximately 2-3 minutes when spoken.

Respond in this exact JSON format:
{
  "transcript": "Full speech transcript here...",
  "mainPoints": ["contention 1", "contention 2"],
  "counterPoints": ["potential counter arguments"],
  "counterCounterPoints": ["responses to counters"],
  "impactWeighing": "Analysis of argument significance and weight",
  "evidence": ["fact/statistic/quote with source", "another piece of evidence"]
}`;
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
            speakerName: `AI Debater ${sp.speakerNumber}`,
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
            speakerName: `AI Debater ${sp.speakerNumber}`,
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

    // Set loading state
    setSpeechLoadingStates(prev => ({ ...prev, [speechNum]: true }));
    setSpeechPlayStates(prev => ({ ...prev, [speechNum]: 'idle' }));

    // Set up TTS event handlers
    ttsService.onAudioReady = () => {
      // Audio is ready to play - show controls
      setSpeechLoadingStates(prev => ({ ...prev, [speechNum]: false }));
      setSpeechPlayStates(prev => ({ ...prev, [speechNum]: 'playing' }));
    };

    ttsService.onAudioEnded = () => {
      // Audio finished naturally - mark as completed
      handleSpeechCompleted(speechNum);
    };

    ttsService.onAudioError = () => {
      // Audio error - reset state
      setSpeechLoadingStates(prev => ({ ...prev, [speechNum]: false }));
      setSpeechPlayStates(prev => ({ ...prev, [speechNum]: 'idle' }));
    };

    try {
      // Choose voice based on team (male voices for affirmative, female for negative)
      const voice = speech.team === 'affirmative' ? 'echo' : 'nova';
      
      await ttsService.speak(speech.transcript, { voice, speed: 0.9 });
    } catch (error) {
      console.error('Error playing AI speech:', error);
      setSpeechLoadingStates(prev => ({ ...prev, [speechNum]: false }));
      setSpeechPlayStates(prev => ({ ...prev, [speechNum]: 'idle' }));
    } finally {
      // Clean up event handlers
      ttsService.onAudioReady = null;
      ttsService.onAudioEnded = null;
      ttsService.onAudioError = null;
    }
  };

  // Pause AI speech
  const pauseAISpeech = (speechNum: number) => {
    ttsService.pause();
    setSpeechPlayStates(prev => ({ ...prev, [speechNum]: 'paused' }));
    
    // Pause the timer
    const interval = speechIntervals[speechNum];
    if (interval) {
      clearInterval(interval);
      setSpeechIntervals(prev => {
        const newIntervals = { ...prev };
        delete newIntervals[speechNum];
        return newIntervals;
      });
    }
  };

  // Resume AI speech
  const resumeAISpeech = (speechNum: number) => {
    ttsService.resume();
    setSpeechPlayStates(prev => ({ ...prev, [speechNum]: 'playing' }));
    
    // Resume the timer
    const interval = setInterval(() => {
      setSpeechTimers((prev: {[key: number]: number}) => ({ ...prev, [speechNum]: (prev[speechNum] || 0) + 1 }));
    }, 1000);
    setSpeechIntervals((prev: {[key: number]: number | undefined}) => ({ ...prev, [speechNum]: interval as unknown as number }));
  };

  // Stop AI speech
  const stopAISpeech = (speechNum: number) => {
    ttsService.stop();
    setSpeechLoadingStates(prev => ({ ...prev, [speechNum]: false }));
    
    // Mark as completed when stopped
    handleSpeechCompleted(speechNum);
  };

  // Handle speech completion (either naturally finished or stopped)
  const handleSpeechCompleted = (speechNum: number) => {
    setSpeechPlayStates(prev => ({ ...prev, [speechNum]: 'completed' }));
    setSpeechLoadingStates(prev => ({ ...prev, [speechNum]: false }));
    
    // Clear the timer
    const interval = speechIntervals[speechNum];
    if (interval) {
      clearInterval(interval);
      setSpeechIntervals((prev: {[key: number]: number | undefined}) => {
        const newIntervals = { ...prev };
        delete newIntervals[speechNum];
        return newIntervals;
      });
    }
    
    // Mark speech as listened to
    setListenedSpeeches(prev => new Set([...prev, speechNum]));
    
    // Add the AI speech to the flow chart now that it's been listened to
    const speech = aiSpeeches[speechNum];
    if (speech) {
      setFlowChartSpeeches(prev => ({
        ...prev,
        [speechNum]: speech
      }));
    }
    
    // Clear required speech if this was the one that needed to be listened to
    if (requiredSpeechToListen === speechNum) {
      setRequiredSpeechToListen(null);
    }
  };

  // On start, simulate up to the user's first speech
  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if format has pre-round prep time
    if (selectedFormatData && selectedFormatData.prepTimeType === 'pre-round' && selectedFormatData.prepTime > 0) {
      setStep('prep');
      return;
    }
    
    setStep('generating');
    const firstUserSpeech = userSpeechNums[0];
    console.log('First user speech:', firstUserSpeech);
    console.log('User speech numbers:', userSpeechNums);
    console.log('Debate order:', debateOrder.map((s, i) => `${i+1}: ${s.team} ${s.speakerNumber}`));
    // Generate AI speeches from speech 1 up to (but not including) the first user speech
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
      
      // Check if there are AI speeches that need to be listened to before the next user speech
      const aiSpeechesToListen = Object.keys(aiSpeeches)
        .map(Number)
        .filter(speechNum => speechNum > speechNum && (nextUserSpeech ? speechNum < nextUserSpeech : true))
        .filter(speechNum => !listenedSpeeches.has(speechNum));
      
      if (aiSpeechesToListen.length > 0) {
        // Set the first unlistened speech as required
        setRequiredSpeechToListen(aiSpeechesToListen[0]);
        setStep('practice');
        setCurrentTranscript('');
        setCurrentSummary({ mainPoints: [], counterPoints: [], counterCounterPoints: [], impactWeighing: '', evidence: [] });
      } else {
        // All AI speeches have been listened to, proceed to next user speech
        setCurrentTranscript('');
        setCurrentSummary({ mainPoints: [], counterPoints: [], counterCounterPoints: [], impactWeighing: '', evidence: [] });
        if (currentSpeechIdx < userSpeechNums.length - 1) {
          setCurrentSpeechIdx(currentSpeechIdx + 1);
          setStep('practice');
        } else {
          setStep('complete');
          // Generate feedback for the user
          setIsGeneratingFeedback(true);
          try {
            const userSpeechesText = Object.values(userSpeeches).join('\n\n');
            const feedback = await AIService.generateSpeakerFeedback(
              userName,
              userTeam,
              topic,
              [userSpeechesText]
            );
            setUserFeedback(feedback);
          } catch (error) {
            console.error('Error generating feedback:', error);
            setUserFeedback({
              strengths: ['Actively participated in the practice debate'],
              areasForImprovement: [
                'Practice speaking more clearly and confidently',
                'Develop stronger argumentation skills'
              ],
              overallAssessment: 'Thank you for completing the practice session! Continue practicing to improve your debate skills.'
            });
          } finally {
            setIsGeneratingFeedback(false);
          }
        }
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
  const composeSession = (): DebateSession => {
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
    
    // Add only AI speeches that have been listened to (in flow chart)
    Object.values(flowChartSpeeches).forEach(speech => {
      points.push(speech);
    });
    
    // Create speakers array with user feedback
    const speakers: Speaker[] = debateOrder.map((sp) => ({
      ...sp,
      name: sp.team === userTeam && sp.speakerNumber === positionInTeam ? userName : sp.name || `AI Debater ${sp.speakerNumber}`,
      points: 0, // No points in practice mode
      feedback: sp.team === userTeam && sp.speakerNumber === positionInTeam ? userFeedback || undefined : undefined
    }));
    
    return {
      id: 'practice-session',
      topic,
      speakers,
      points: points.sort((a, b) => a.speechNumber - b.speechNumber),
      startTime: new Date(),
      endTime: step === 'complete' ? new Date() : undefined,
      hintsUsed,
      firstSpeaker: firstSpeaker,
      summary: 'Practice session completed! Focus on the feedback below to improve your debate skills.'
    };
  };

  // Format time for display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    console.log('Current user speech:', currentUserSpeech);
    console.log('AI speeches available:', Object.keys(aiSpeeches));
    if (!currentUserSpeech) return [];
    
    const speechesToShow = Object.values(aiSpeeches)
      .filter(speech => speech.speechNumber < currentUserSpeech)
      .sort((a, b) => a.speechNumber - b.speechNumber);
    console.log('AI speeches to show:', speechesToShow.map(s => `Speech ${s.speechNumber}: ${s.speakerName}`));
    return speechesToShow;
  };

  // Create a mock session for HintPanel
  const createMockSession = () => {
    return {
      topic,
      points: Object.values(flowChartSpeeches).sort((a, b) => a.speechNumber - b.speechNumber)
    };
  };

  // Format Selection Step
  if (step === 'format') {
    console.log('🔍 PracticeMode: Rendering format selection step');
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-5xl relative border border-indigo-200/40 animate-in slide-in-from-bottom-4 duration-500">
          {/* Back Button - moved to top right to avoid overlap */}
          <button
            onClick={onBack}
            className="absolute top-6 right-6 flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 hover:bg-indigo-100 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="text-center mb-10 pt-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-3">Choose Practice Format</h1>
            <p className="text-indigo-600 text-lg">Select a standard format or customize your own settings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Standard Formats */}
            {DEBATE_FORMATS.map((format) => (
              <button
                key={format.name}
                onClick={() => handleFormatSelect(format)}
                className="bg-gradient-to-br from-indigo-50/90 to-purple-50/90 backdrop-blur-sm border-2 border-indigo-200/60 rounded-2xl p-6 hover:border-indigo-400 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{format.icon}</div>
                  <h3 className="text-xl font-bold text-indigo-900 mb-3 group-hover:text-indigo-700 transition-colors">
                    {format.name}
                  </h3>
                  <p className="text-indigo-700 text-sm mb-4 leading-relaxed">{format.description}</p>
                  <div className="space-y-2 text-xs text-indigo-600">
                    <div className="flex items-center space-x-2">
                      <span className="text-indigo-500">👥</span>
                      <span>{format.peoplePerTeam === 1 ? '1v1' : `${format.peoplePerTeam}v${format.peoplePerTeam}`}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-indigo-500">🎤</span>
                      <span>{format.speechesPerSpeaker} speech{format.speechesPerSpeaker > 1 ? 'es' : ''} per speaker</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-indigo-500">🥇</span>
                      <span>{format.firstSpeaker === 'affirmative' ? 'Aff' : 'Neg'} speaks first</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <div className="font-semibold text-indigo-800">⏱️ Prep Time: {format.prepTime} min</div>
                      <div className="text-indigo-600 mt-1">
                        {format.prepTimeType === 'flexible' ? 'Use anytime during round' : 'Use before round starts'}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))}

            {/* Custom Format Option */}
            <button
              onClick={() => handleFormatSelect(null)}
              className="bg-gradient-to-br from-purple-50/90 to-pink-50/90 backdrop-blur-sm border-2 border-purple-200/60 rounded-2xl p-6 hover:border-purple-400 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">⚙️</div>
                <h3 className="text-xl font-bold text-purple-900 mb-3 group-hover:text-purple-700 transition-colors">
                  Custom Format
                </h3>
                <p className="text-purple-700 text-sm mb-4 leading-relaxed">
                  Create your own practice format with custom settings
                </p>
                <div className="space-y-2 text-xs text-purple-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-500">🎛️</span>
                    <span>Customize team sizes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-500">🎤</span>
                    <span>Set speech counts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-500">⚡</span>
                    <span>Flexible configuration</span>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Setup Step
  if (step === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-4xl relative border border-indigo-200/30">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="absolute top-6 left-6 flex items-center space-x-2 text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Mode Selection</span>
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-900 mb-2">Practice Setup</h1>
            <p className="text-indigo-700">
              {selectedFormatData ? `Setting up ${selectedFormatData.name} practice` : 'Setting up custom practice format'}
            </p>
          </div>

          <form onSubmit={handleStart} className="space-y-6">
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Debate Topic
              </label>
              
              {/* Random Topic Selector */}
              <RandomTopicSelector 
                onTopicSelect={setTopic}
                format={selectedFormatData?.name === 'Public Forum' ? 'publicForum' : 
                       selectedFormatData?.name === 'Lincoln Douglas' ? 'lincolnDouglas' :
                       selectedFormatData?.name === 'Policy Debate' ? 'policy' :
                       selectedFormatData?.name === 'Parliamentary' ? 'parliamentary' :
                       selectedFormatData?.name === 'Spar Debate' ? 'spar' : undefined}
                showRandomTopics={!selectedFormatData || selectedFormatData.name === 'Spar Debate' || selectedFormatData.name === 'Parliamentary'}
              />
              
              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">or enter your own topic</span>
                </div>
              </div>
              
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="Enter the debate topic or resolution..."
                required
              />
            </div>
            
            {/* First Speaker Selection - only show for Parliamentary and Public Forum formats */}
            {selectedFormatData && (selectedFormatData.name === 'Public Forum' || selectedFormatData.name === 'Parliamentary') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Which Side Speaks First</label>
                <select
                  value={firstSpeaker}
                  onChange={e => setFirstSpeaker(e.target.value as 'affirmative' | 'negative')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="affirmative">Affirmative</option>
                  <option value="negative">Negative</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Determines the speaking order</p>
              </div>
            )}
            
            {/* Format Summary - show if preset format selected */}
            {selectedFormatData && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2 flex items-center">
                  <span className="mr-2">{selectedFormatData.icon}</span>
                  {selectedFormatData.name} Format
                </h3>
                <p className="text-sm text-indigo-700 mb-2">{selectedFormatData.description}</p>
                <p className="text-xs text-indigo-600">👥 {selectedFormatData.peoplePerTeam === 1 ? '1v1' : `${selectedFormatData.peoplePerTeam}v${selectedFormatData.peoplePerTeam}`} • 🎤 {selectedFormatData.speechesPerSpeaker} speech{selectedFormatData.speechesPerSpeaker > 1 ? 'es' : ''} per speaker • 🥇 {selectedFormatData.firstSpeaker === 'affirmative' ? 'Affirmative' : 'Negative'} speaks first</p>
                <p className="text-xs text-indigo-600 mt-1">⚖️ Default judging style</p>
              </div>
            )}

            {/* Custom Format Configuration - show if no preset format selected */}
            {!selectedFormatData && (
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-indigo-800 mb-2 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Custom Format Configuration
                </h3>
                <p className="text-sm text-indigo-700 mb-4">Configure your own practice format settings</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* People per Team */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      People per Team
                    </label>
                    <select
                      value={peoplePerTeam}
                      onChange={(e) => setPeoplePerTeam(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value={1}>1 (1v1)</option>
                      <option value={2}>2 (2v2)</option>
                      <option value={3}>3 (3v3)</option>
                      <option value={4}>4 (4v4)</option>
                    </select>
                  </div>

                  {/* Speeches per Speaker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speeches per Speaker
                    </label>
                    <select
                      value={speechesPerSpeaker}
                      onChange={(e) => setSpeechesPerSpeaker(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value={1}>1 speech</option>
                      <option value={2}>2 speeches</option>
                      <option value={3}>3 speeches</option>
                      <option value={4}>4 speeches</option>
                    </select>
                  </div>

                  {/* Prep Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prep Time (minutes)
                    </label>
                    <select
                      value={prepTime}
                      onChange={(e) => setPrepTime(parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value={0}>No prep time</option>
                      <option value={2}>2 minutes</option>
                      <option value={3}>3 minutes</option>
                      <option value={4}>4 minutes</option>
                      <option value={5}>5 minutes</option>
                      <option value={8}>8 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={20}>20 minutes</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-indigo-100 rounded-lg">
                  <p className="text-sm text-indigo-800">
                    <strong>Format Summary:</strong> {peoplePerTeam}v{peoplePerTeam} • {speechesPerSpeaker} speech{speechesPerSpeaker > 1 ? 'es' : ''} per speaker • {prepTime > 0 ? `${prepTime} min prep time` : 'No prep time'}
                  </p>
                </div>
              </div>
            )}
            
            {/* User Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter your name..."
                required
              />
            </div>

            {/* Side Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Which Side Are You On?
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  getUserTeam() === 'affirmative' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}>
                  <input
                    type="radio"
                    name="team"
                    value="affirmative"
                    checked={getUserTeam() === 'affirmative'}
                    onChange={() => setUserTeam('affirmative')}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">✅</div>
                    <div className="font-medium text-indigo-900">Affirmative</div>
                    <div className="text-xs text-indigo-600">Supporting the resolution</div>
                  </div>
                </label>
                
                <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                  getUserTeam() === 'negative' 
                    ? 'border-indigo-500 bg-indigo-50' 
                    : 'border-gray-200 hover:border-indigo-300'
                }`}>
                  <input
                    type="radio"
                    name="team"
                    value="negative"
                    checked={getUserTeam() === 'negative'}
                    onChange={() => setUserTeam('negative')}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-2xl mb-2">❌</div>
                    <div className="font-medium text-indigo-900">Negative</div>
                    <div className="text-xs text-indigo-600">Opposing the resolution</div>
                  </div>
                </label>
              </div>
            </div>

            {/* Speaker Number Selection - only for 2v2 formats */}
            {(selectedFormatData && selectedFormatData.peoplePerTeam === 2) || (!selectedFormatData && peoplePerTeam === 2) ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Speaker Number on Your Team
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  Select which speaker position you want to practice as on your team.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    userSpeakerNumber === 1 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                    <input
                      type="radio"
                      name="speakerNumber"
                      value={1}
                      checked={userSpeakerNumber === 1}
                      onChange={(e) => setUserSpeakerNumber(parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">🥇</div>
                      <div className="font-medium text-indigo-900">1st Speaker</div>
                      <div className="text-xs text-indigo-600">Constructive speech</div>
                    </div>
                  </label>
                  
                  <label className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    userSpeakerNumber === 2 
                      ? 'border-indigo-500 bg-indigo-50' 
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}>
                    <input
                      type="radio"
                      name="speakerNumber"
                      value={2}
                      checked={userSpeakerNumber === 2}
                      onChange={(e) => setUserSpeakerNumber(parseInt(e.target.value))}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl mb-2">🥈</div>
                      <div className="font-medium text-indigo-900">2nd Speaker</div>
                      <div className="text-xs text-indigo-600">Rebuttal speech</div>
                    </div>
                  </label>
                </div>
              </div>
            ) : null}
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-6 rounded-lg font-semibold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Practice Session
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Prep Step
  if (step === 'prep') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-4xl relative border border-indigo-200/30">
          {/* Back Button */}
          <button
            onClick={() => setStep('setup')}
            className="absolute top-6 left-6 flex items-center space-x-2 text-indigo-700 hover:text-indigo-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Setup</span>
          </button>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-indigo-900 mb-2">Prep Time</h1>
            <p className="text-indigo-700">
              Use your prep time before the practice session begins
            </p>
          </div>

          {selectedFormatData && selectedFormatData.prepTime > 0 && (
            <PrepTime
              totalPrepTime={selectedFormatData.prepTime}
              prepTimeType={selectedFormatData.prepTimeType}
              onPrepTimeUsed={(time) => setPrepTimeUsed(time)}
              onPrepTimeComplete={() => {
                setStep('generating');
                const firstUserSpeech = userSpeechNums[0];
                generateAISpeechesUpTo(0, firstUserSpeech).then(() => {
                  setStep('practice');
                });
              }}
            />
          )}

          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                setStep('generating');
                const firstUserSpeech = userSpeechNums[0];
                await generateAISpeechesUpTo(0, firstUserSpeech);
                setStep('practice');
              }}
              className="bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {selectedFormatData && selectedFormatData.prepTime > 0 ? 
                'Skip Prep Time & Start Round' : 
                'Start Round'
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generating Step
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="bg-white backdrop-blur-sm rounded-2xl shadow-xl p-8 w-full max-w-2xl relative border border-indigo-200/30">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-indigo-900 mb-4">Generating AI Speeches</h2>
            <p className="text-indigo-700 mb-6">
              Creating realistic debate scenarios and AI opponent speeches...
            </p>
            <div className="space-y-2 text-sm text-indigo-600">
              <div>• Analyzing debate topic and format</div>
              <div>• Generating opposing arguments</div>
              <div>• Creating realistic speech content</div>
              <div>• Preparing interactive elements</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {isGeneratingFeedback ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Generating Your Feedback</h2>
              <p className="text-gray-600">Analyzing your performance and creating personalized feedback...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Practice Complete!</h2>
              <DebateFlowTable 
                session={composeSession()} 
                peoplePerTeam={peoplePerTeam}
                speechesPerSpeaker={speechesPerSpeaker}
              />
            </div>
            
            {/* Final Analysis with Feedback */}
            <div className="mb-6">
              <FinalAnalysis session={composeSession()} />
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={onBack}
                className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column - AI Speeches */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Previous Speeches</h3>
            <div className="space-y-3">
              {getAISpeechesToShow().map((speech) => {
                const playState = speechPlayStates[speech.speechNumber] || 'idle';
                const isLoading = speechLoadingStates[speech.speechNumber] || false;
                const hasBeenListened = playState === 'completed';
                const isRequired = requiredSpeechToListen === speech.speechNumber;
                const currentTime = speechTimers[speech.speechNumber] || 0;
                
                return (
                  <div key={speech.id} className={`border rounded-lg p-3 ${
                    isRequired 
                      ? 'border-orange-400 bg-orange-50' 
                      : hasBeenListened 
                        ? 'border-green-300 bg-green-50' 
                        : 'border-gray-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          speech.team === 'affirmative' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {speech.team}
                        </span>
                        {hasBeenListened && (
                          <span className="text-green-600 text-xs">✓ Listened</span>
                        )}
                        {isRequired && (
                          <span className="text-orange-600 text-xs font-medium">⚠️ Required</span>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">Speech {speech.speechNumber}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {hasBeenListened ? speech.transcript.substring(0, 100) + '...' : 'Click listen to hear this speech'}
                    </p>
                    {isLoading && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                        ⏳ Preparing audio...
                      </div>
                    )}
                    {isRequired && !hasBeenListened && (
                      <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                        🔊 You must listen to this speech before continuing
                      </div>
                    )}
                    
                    {/* Timer display when playing or paused */}
                    {(playState === 'playing' || playState === 'paused') && (
                      <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 flex items-center justify-center space-x-2">
                        <span>⏱️</span>
                        <span className="font-mono font-medium">{formatTime(currentTime)}</span>
                        {playState === 'playing' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    )}
                    
                    {/* Control buttons based on state */}
                    <div className="flex space-x-1">
                      {(playState === 'idle' || isLoading) && (
                        <button
                          onClick={() => playAISpeech(speech.speechNumber)}
                          disabled={isLoading}
                          className={`flex-1 text-white py-1 px-2 rounded text-xs transition-colors flex items-center justify-center space-x-1 ${
                            isRequired && !hasBeenListened
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {isLoading && (
                            <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                          )}
                          <span>
                            {isLoading
                              ? 'Loading...' 
                              : 'Listen'
                            }
                          </span>
                        </button>
                      )}
                      
                      {(playState === 'playing' || playState === 'paused') && (
                        <>
                          {playState === 'playing' && (
                            <button
                              onClick={() => pauseAISpeech(speech.speechNumber)}
                              className="flex-1 bg-yellow-600 text-white py-1 px-2 rounded text-xs hover:bg-yellow-700 transition-colors"
                            >
                              Pause
                            </button>
                          )}
                          {playState === 'paused' && (
                            <button
                              onClick={() => resumeAISpeech(speech.speechNumber)}
                              className="flex-1 bg-green-600 text-white py-1 px-2 rounded text-xs hover:bg-green-700 transition-colors"
                            >
                              Resume
                            </button>
                          )}
                          <button
                            onClick={() => stopAISpeech(speech.speechNumber)}
                            className="flex-1 bg-red-600 text-white py-1 px-2 rounded text-xs hover:bg-red-700 transition-colors"
                          >
                            Stop
                          </button>
                        </>
                      )}
                      
                      {playState === 'completed' && (
                        <button
                          onClick={() => {
                            setSpeechPlayStates(prev => ({ ...prev, [speech.speechNumber]: 'idle' }));
                            setSpeechTimers(prev => ({ ...prev, [speech.speechNumber]: 0 }));
                          }}
                          className="flex-1 bg-gray-600 text-white py-1 px-2 rounded text-xs hover:bg-gray-700 transition-colors"
                        >
                          Listen Again
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center Column - Recording */}
        <div className="lg:col-span-1">
          {requiredSpeechToListen && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">
                  ⚠️
                </div>
                <h4 className="font-medium text-orange-800">Required Action</h4>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                You must listen to Speech #{requiredSpeechToListen} before you can give your next speech. 
                This ensures you hear and respond to the AI's arguments.
              </p>
              <button
                onClick={() => {
                  const speech = Object.values(aiSpeeches).find(s => s.speechNumber === requiredSpeechToListen);
                  if (speech) {
                    playAISpeech(requiredSpeechToListen);
                  }
                }}
                className="bg-orange-600 text-white py-2 px-4 rounded text-sm hover:bg-orange-700 transition-colors"
              >
                Listen to Required Speech
              </button>
            </div>
          )}
          {!requiredSpeechToListen ? (
            <RecordingPanel
              currentSpeaker={getCurrentSpeaker()}
              speechNumber={userSpeechNums[currentSpeechIdx]}
              totalSpeeches={totalSpeeches}
              onSpeechComplete={handleSpeechComplete}
              speechRecognition={whisperService}
              isAnalyzing={isSummarizing}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎧</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Listen First</h3>
                <p className="text-gray-600 mb-4">
                  You need to listen to Speech #{requiredSpeechToListen} before you can record your response.
                </p>
                <p className="text-sm text-gray-500">
                  Click the "Listen" button in the Previous Speeches section to hear the AI's arguments.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Analysis & Hints */}
        <div className="lg:col-span-1 space-y-4">
          {currentTranscript && !requiredSpeechToListen && (
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

          {getCurrentSpeaker() && !requiredSpeechToListen && (
            <HintPanel
              currentSpeaker={getCurrentSpeaker()!}
              session={createMockSession()}
              onHintUsed={handleHintUsed}
              hintsUsed={hintsUsed}
            />
          )}

          {/* Prep Time Component */}
          {selectedFormatData && selectedFormatData.prepTimeType === 'flexible' && selectedFormatData.prepTime > 0 && (
            <PrepTime
              totalPrepTime={selectedFormatData.prepTime}
              prepTimeType={selectedFormatData.prepTimeType}
              onPrepTimeUsed={(time) => setPrepTimeUsed(time)}
            />
          )}
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
  </div>
  );
};

export default PracticeMode;