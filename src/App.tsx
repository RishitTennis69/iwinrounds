import { useState, useEffect, useRef } from 'react';
import { DebateSession, Speaker, DebatePoint } from './types';
import { WhisperService } from './utils/whisperService';
import { AIService } from './utils/aiService';
import SetupPanel from './components/SetupPanel';
import RecordingPanel from './components/RecordingPanel';
import DebateFlowTable from './components/DebateFlowTable';
import FinalAnalysis from './components/FinalAnalysis';
import ModeSelection from './components/ModeSelection';
import PracticeMode from './components/PracticeMode';
import HintPanel from './components/HintPanel';

function App() {
  const [mode, setMode] = useState<'selection' | 'debate' | 'practice' | 'argument-mapping'>('selection');
  const [session, setSession] = useState<DebateSession | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [speechNumber, setSpeechNumber] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [whisperService] = useState(() => new WhisperService());
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const finalAnalysisRef = useRef<HTMLDivElement>(null);

  // Load free rounds count from localStorage on component mount
  useEffect(() => {
    const savedRounds = localStorage.getItem('reasynai_free_rounds');
    const savedAdmin = localStorage.getItem('reasynai_admin');
    if (savedRounds) {
      // setFreeRoundsUsed(parseInt(savedRounds)); // Removed
    }
    if (savedAdmin === 'true') {
      // setIsAdmin(true); // Removed
    }
  }, []);

  const handleModeSelect = (selectedMode: 'debate' | 'practice' | 'argument-mapping') => {
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

  const handleHintUsed = () => {
    setHintsUsed(prev => prev + 1);
    // Update session hints used
    if (session) {
      setSession(prev => prev ? { ...prev, hintsUsed: prev.hintsUsed + 1 } : null);
    }
  };

  const initializeSession = (topic: string, speakers: Speaker[], people: number, speeches: number, firstSpeaker: 'affirmative' | 'negative') => {
    // Check if user has free rounds or is admin // Removed
    // if (freeRoundsUsed >= 1 && !isAdmin) { // Removed
    //   setShowPasswordModal(true); // Removed
    //   return; // Removed
    // } // Removed
    setPeoplePerTeam(people);
    setSpeechesPerSpeaker(speeches);
    setHintsUsed(0);
    
    const newSession: DebateSession = {
      id: Date.now().toString(),
      topic,
      speakers,
      points: [],
      startTime: new Date(),
      hintsUsed: 0, // Keep this for now, as it's part of DebateSession
      firstSpeaker: firstSpeaker
    };
    setSession(newSession);
    
    // Create debate order that goes through speakers in sequence
    const debateOrder = createDebateOrder(speakers, speeches, firstSpeaker);
    setCurrentSpeaker(debateOrder[0]);
  };

  // Create debate order based on people per team and speeches per speaker
  const createDebateOrder = (speakers: Speaker[], speeches: number, firstSpeaker: 'affirmative' | 'negative'): Speaker[] => {
    // Alternate between teams, each speaker in order, repeat for speeches per speaker
    const aff = speakers.filter(s => s.team === 'affirmative');
    const neg = speakers.filter(s => s.team === 'negative');
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
        evidence: analysis.evidence,
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
      const debateOrder = createDebateOrder(session.speakers, speechesPerSpeaker, session.firstSpeaker);
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
      setIsAnalyzing(true);
      
      // Analyze the overall winner
      const analysis = await AIService.analyzeWinner(updatedSession);
      
      // Generate personalized feedback for each speaker
      const speakersWithPointsAndFeedback = await Promise.all(
        updatedSession.speakers.map(async (speaker) => {
          // Use the AI-generated points (already validated to ensure winning team has higher scores)
          const points = analysis.speakerPoints[speaker.id] || 27;
          
          // Gather all speeches for this speaker
          const speeches = updatedSession.points
            .filter(p => p.speakerId === speaker.id)
            .map(p => p.transcript);
          
          // Generate personalized feedback
          let feedback: string | {
            strengths: string[];
            areasForImprovement: string[];
            overallAssessment: string;
          } = '';
          
          try {
            console.log(`Generating feedback for ${speaker.name} with ${speeches.length} speeches`);
            feedback = await AIService.generateSpeakerFeedback(
              speaker.name,
              speaker.team,
              updatedSession.topic,
              speeches
            );
            console.log(`Feedback generated for ${speaker.name}:`, feedback);
          } catch (err) {
            console.error('Error generating feedback for', speaker.name, err);
            console.error('Error details:', {
              speakerName: speaker.name,
              team: speaker.team,
              topic: updatedSession.topic,
              speechCount: speeches.length,
              speeches: speeches
            });
            feedback = {
              strengths: ['Actively participated in the debate'],
              areasForImprovement: [
                'Practice speaking more clearly and confidently',
                'Develop stronger argumentation skills'
              ],
              overallAssessment: 'Unable to generate personalized feedback at this time.'
            };
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
          reasoning: analysis.keyArguments, // Using keyArguments as the main reasoning
          keyArguments: analysis.keyArguments,
          clash: analysis.clash,
        },
        summary: analysis.summary,
        speakers: speakersWithPointsAndFeedback,
      };
      setSession(finalSession);
      handleDebateComplete(); // Mark debate as completed
      
      // Show completion popup and auto-scroll
      setShowCompletionPopup(true);
      setTimeout(() => {
        if (finalAnalysisRef.current) {
          finalAnalysisRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    } catch (error) {
      console.error('Error analyzing winner:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDebateComplete = () => {
    // Increment free rounds count when debate is completed // Removed
    // if (!isAdmin) { // Removed
    //   const newCount = freeRoundsUsed + 1; // Removed
    //   setFreeRoundsUsed(newCount); // Removed
    //   localStorage.setItem('reasynai_free_rounds', newCount.toString()); // Removed
    // } // Removed
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
        // freeRoundsUsed={freeRoundsUsed} // Removed
        // isAdmin={isAdmin} // Removed
      />
    );
  }

  // Show practice mode
  if (mode === 'practice') {
    return (
      <PracticeMode 
        onBack={handleBackToModeSelection}
        // freeRoundsUsed={freeRoundsUsed} // Removed
        // isAdmin={isAdmin} // Removed
      />
    );
  }

  // Show setup panel if no session
  if (!session) {
    return (
      <div>
        <SetupPanel 
          onInitialize={initializeSession} 
          // freeRoundsUsed={freeRoundsUsed} // Removed
          // isAdmin={isAdmin} // Removed
        />
        {/* {showPasswordModal && ( // Removed
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"> // Removed
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4"> // Removed
              <h2 className="text-2xl font-bold mb-4">Admin Password Required</h2> // Removed
              <p className="text-gray-700 mb-4"> // Removed
                You have used your free round. Please enter the admin password to continue. // Removed
              </p> // Removed
              <form onSubmit={handlePasswordSubmit} className="space-y-4"> // Removed
                <div> // Removed
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700"> // Removed
                    Password: // Removed
                  </label> // Removed
                  <input // Removed
                    type="password" // Removed
                    id="password" // Removed
                    value={passwordInput} // Removed
                    onChange={(e) => setPasswordInput(e.target.value)} // Removed
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm px-3 py-2 border focus:ring-2 focus:ring-blue-500 focus:border-transparent" // Removed
                    placeholder="Enter admin password" // Removed
                  /> // Removed
                  {passwordError && <p className="text-red-500 text-sm mt-1">{passwordError}</p>} // Removed
                </div> // Removed
                <div className="flex space-x-3"> // Removed
                  <button // Removed
                    type="submit" // Removed
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors" // Removed
                  > // Removed
                    Submit // Removed
                  </button> // Removed
                  <button // Removed
                    type="button" // Removed
                    onClick={() => setShowPasswordModal(false)} // Removed
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors" // Removed
                  > // Removed
                    Cancel // Removed
                  </button> // Removed
                </div> // Removed
              </form> // Removed
            </div> // Removed
          </div> // Removed
        )} */}
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
                ReasynAI - Your Personal AI Coach
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
              totalSpeeches={peoplePerTeam * 2 * speechesPerSpeaker}
              onSpeechComplete={handleSpeechComplete}
              speechRecognition={whisperService}
              isAnalyzing={isAnalyzing}
            />
            {session && currentSpeaker && (
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
            <DebateFlowTable 
              session={session} 
              peoplePerTeam={peoplePerTeam} 
              speechesPerSpeaker={speechesPerSpeaker}
            />
          </div>
        </div>

        {/* Final Analysis */}
        {session.winner && (
          <div ref={finalAnalysisRef} className="mt-8">
            <FinalAnalysis session={session} />
          </div>
        )}
      </div>

      {/* Completion Popup */}
      {showCompletionPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Round Complete!</h2>
            <p className="text-gray-700 mb-6">
              Your debate analysis is ready! Scroll down to see your final results and personalized feedback.
            </p>
            <button
              onClick={() => setShowCompletionPopup(false)}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              View Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 