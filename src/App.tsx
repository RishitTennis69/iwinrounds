import React, { useState, useEffect } from 'react';
import { DebateSession, Speaker, DebatePoint } from './types';
import { SpeechRecognitionService } from './utils/speechRecognition';
import { AIService } from './utils/aiService';
import SetupPanel from './components/SetupPanel';
import RecordingPanel from './components/RecordingPanel';
import DebateFlowTable from './components/DebateFlowTable';
import FinalAnalysis from './components/FinalAnalysis';
import HintPanel from './components/HintPanel';
import ModeSelection from './components/ModeSelection';
import PracticeMode from './components/PracticeMode';

const ADMIN_PASSWORD = 'RomeAcademy111!';

function App() {
  const [mode, setMode] = useState<'selection' | 'debate' | 'practice'>('selection');
  const [session, setSession] = useState<DebateSession | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [speechNumber, setSpeechNumber] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speechRecognition] = useState(() => new SpeechRecognitionService());
  const [freeRoundsUsed, setFreeRoundsUsed] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);

  // Load free rounds count from localStorage on component mount
  useEffect(() => {
    const savedRounds = localStorage.getItem('debateflowy_free_rounds');
    const savedAdmin = localStorage.getItem('debateflowy_admin');
    if (savedRounds) {
      setFreeRoundsUsed(parseInt(savedRounds));
    }
    if (savedAdmin === 'true') {
      setIsAdmin(true);
    }
  }, []);

  const handleModeSelect = (selectedMode: 'debate' | 'practice') => {
    setMode(selectedMode);
  };

  const handleBackToModeSelection = () => {
    setMode('selection');
    setSession(null);
    setCurrentSpeaker(null);
    setSpeechNumber(1);
    setIsAnalyzing(false);
    setHintsUsed(0);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAdmin(true);
      localStorage.setItem('debateflowy_admin', 'true');
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

  const initializeSession = (topic: string, speakers: Speaker[], people: number, speeches: number) => {
    // Check if user has free rounds or is admin
    if (freeRoundsUsed >= 1 && !isAdmin) {
      setShowPasswordModal(true);
      return;
    }
    setPeoplePerTeam(people);
    setSpeechesPerSpeaker(speeches);
    
    const newSession: DebateSession = {
      id: Date.now().toString(),
      topic,
      speakers,
      points: [],
      startTime: new Date(),
      hintsUsed: 0
    };
    setSession(newSession);
    setHintsUsed(0);
    
    // Create debate order that goes through speakers in sequence
    const debateOrder = createDebateOrder(speakers, speeches);
    setCurrentSpeaker(debateOrder[0]);
  };

  // Create debate order based on people per team and speeches per speaker
  const createDebateOrder = (speakers: Speaker[], speeches: number): Speaker[] => {
    // Alternate between teams, each speaker in order, repeat for speeches per speaker
    const aff = speakers.filter(s => s.team === 'affirmative');
    const neg = speakers.filter(s => s.team === 'negative');
    const sequence: Speaker[] = [];
    for (let i = 0; i < peoplePerTeam; i++) {
      sequence.push(aff[i]);
      sequence.push(neg[i]);
    }
    // Repeat the sequence for speeches per speaker
    const debateOrder: Speaker[] = [];
    for (let i = 0; i < speeches; i++) {
      for (let j = 0; j < sequence.length; j++) {
        debateOrder.push(sequence[j]);
      }
    }
    return debateOrder;
  };

  const handleSpeechComplete = async (transcript: string) => {
    console.log('handleSpeechComplete called with transcript:', transcript);
    console.log('Current session:', session);
    console.log('Current speaker:', currentSpeaker);
    console.log('Current speech number:', speechNumber);
    
    if (!session || !currentSpeaker) {
      console.log('Missing session or currentSpeaker');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      console.log('Starting AI analysis...');
      // Analyze the speech with AI
      const analysis = await AIService.summarizeSpeech(transcript);
      console.log('AI analysis completed:', analysis);
      
      const newPoint: DebatePoint = {
        id: Date.now().toString(),
        speakerId: currentSpeaker.id,
        speakerName: currentSpeaker.name,
        team: currentSpeaker.team,
        speechNumber,
        mainPoints: analysis.mainPoints,
        counterPoints: analysis.counterPoints,
        counterCounterPoints: analysis.counterCounterPoints,
        impactWeighing: analysis.impactWeighing,
        timestamp: new Date(),
        transcript,
      };

      console.log('Created new point:', newPoint);

      const updatedSession = {
        ...session,
        points: [...session.points, newPoint],
      };
      
      console.log('Updated session:', updatedSession);
      setSession(updatedSession);
      
      // Get the debate order and move to next speaker
      const debateOrder = createDebateOrder(session.speakers, speechesPerSpeaker);
      console.log('Debate order:', debateOrder);
      console.log('Looking for speaker at index:', speechNumber);
      const nextSpeaker = debateOrder[speechNumber]; // speechNumber is 1-indexed, but we want the next speaker
      console.log('Next speaker:', nextSpeaker);
      
      setCurrentSpeaker(nextSpeaker);
      setSpeechNumber(speechNumber + 1);
      
      // If we've completed all 8 speeches, analyze the winner
      if (speechNumber >= peoplePerTeam * 2 * speechesPerSpeaker) {
        await analyzeWinner(updatedSession);
      }
    } catch (error) {
      console.error('Error analyzing speech:', error);
      alert('Error analyzing speech. Please check your API key and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeWinner = async (updatedSession: DebateSession) => {
    try {
      const analysis = await AIService.analyzeWinner(updatedSession);
      // Assign random points (25-30) and generate feedback for each speaker
      const speakersWithPointsAndFeedback = await Promise.all(
        updatedSession.speakers.map(async (speaker) => {
          // Assign points (use AI if available, else random 25-30)
          const points = analysis.speakerPoints[speaker.id] || (25 + Math.floor(Math.random() * 6));
          // Gather all speeches for this speaker
          const speeches = updatedSession.points
            .filter(p => p.speakerId === speaker.id)
            .map(p => p.transcript);
          // Generate personalized feedback
          let feedback = '';
          try {
            feedback = await AIService.generateSpeakerFeedback(
              speaker.name,
              speaker.team,
              updatedSession.topic,
              speeches
            );
          } catch (err) {
            feedback = 'Error generating feedback.';
          }
          return {
            ...speaker,
            points,
            feedback,
          };
        })
      );
      const finalSession: DebateSession = {
        ...updatedSession,
        endTime: new Date(),
        winner: {
          team: analysis.winner,
          reasoning: analysis.reasoning,
        },
        summary: analysis.summary,
        speakers: speakersWithPointsAndFeedback,
      };
      setSession(finalSession);
      handleDebateComplete(); // Mark debate as completed
    } catch (error) {
      console.error('Error analyzing winner:', error);
    }
  };

  const handleDebateComplete = () => {
    // Increment free rounds count when debate is completed
    if (!isAdmin) {
      const newCount = freeRoundsUsed + 1;
      setFreeRoundsUsed(newCount);
      localStorage.setItem('debateflowy_free_rounds', newCount.toString());
    }
  };

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1);
    if (session) {
      setSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
    }
  };

  // Reset hints when moving to next speech
  useEffect(() => {
    if (session && speechNumber > 1) {
      setHintsUsed(0);
      setSession(prev => prev ? { ...prev, hintsUsed: 0 } : null);
    }
  }, [speechNumber, session]);

  // Show mode selection if no mode selected
  if (mode === 'selection') {
    return (
      <ModeSelection 
        onSelectMode={handleModeSelect}
        freeRoundsUsed={freeRoundsUsed}
        isAdmin={isAdmin}
      />
    );
  }

  // Show practice mode
  if (mode === 'practice') {
    return (
      <PracticeMode 
        onBack={handleBackToModeSelection}
        freeRoundsUsed={freeRoundsUsed}
        isAdmin={isAdmin}
      />
    );
  }

  // Show setup panel if no session
  if (!session) {
    return (
      <div>
        <SetupPanel 
          onInitialize={initializeSession} 
          freeRoundsUsed={freeRoundsUsed}
          isAdmin={isAdmin}
        />
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold mb-4">Admin Password Required</h2>
              <p className="text-gray-700 mb-4">
                You have used your free round. Please enter the admin password to continue.
              </p>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password:
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter admin password"
                  />
                  {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                DebateFlowy
              </h1>
              <p className="text-gray-600">
                Topic: {session.topic} | Speech {speechNumber}/{peoplePerTeam * 2 * speechesPerSpeaker}
              </p>
            </div>
            <button
              onClick={handleBackToModeSelection}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Mode Selection
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Recording Panel and Hint Panel */}
          <div className="lg:col-span-1 space-y-6">
            <RecordingPanel
              currentSpeaker={currentSpeaker}
              speechNumber={speechNumber}
              onSpeechComplete={handleSpeechComplete}
              speechRecognition={speechRecognition}
              isAnalyzing={isAnalyzing}
            />
            
            {currentSpeaker && (
              <HintPanel
                currentSpeaker={currentSpeaker}
                session={session}
                hintsUsed={hintsUsed}
                onHintUsed={handleHintUsed}
              />
            )}
          </div>

          {/* Debate Flow Table */}
          <div className="lg:col-span-3">
            <DebateFlowTable session={session} peoplePerTeam={peoplePerTeam} speechesPerSpeaker={speechesPerSpeaker} />
          </div>
        </div>

        {/* Final Analysis */}
        {session.winner && (
          <div className="mt-8">
            <FinalAnalysis session={session} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App; 