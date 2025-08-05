import React, { useState, useEffect, useRef } from 'react';
import { Speaker, DebatePoint, DebateSession } from './types';
import { WhisperService } from './utils/whisperService';
import { AIService } from './utils/aiService';
import { TTSService } from './utils/ttsService';
import { DebateSessionService } from './utils/debateSessionService';
import RecordingPanel from './components/RecordingPanel';
import DebateFlowTable from './components/DebateFlowTable';
import HintPanel from './components/HintPanel';
import SetupPanel from './components/SetupPanel';
import PracticeMode from './components/PracticeMode';
import { HeroSection } from './components/ui/spline-demo';
import ModeSelection from './components/ModeSelection';
import FinalAnalysis from './components/FinalAnalysis';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import StudentDashboard from './components/dashboard/StudentDashboard';
import CoachDashboard from './components/dashboard/CoachDashboard';

// Main App Component with Authentication
const AppWithAuth: React.FC = () => {
  const { user, profile, loading, supabaseConfigured } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If Supabase is not configured, show the original debate app
  if (!supabaseConfigured) {
    return <App />;
  }

  // If user is not logged in, show landing page with option to login
  if (!user) {
    if (showLogin) {
      return <LoginForm onSuccess={() => setShowLogin(false)} />;
    }
    return <App onShowLogin={() => setShowLogin(true)} />;
  }

  // Route based on user type
  if (profile?.user_type === 'business_admin' || profile?.user_type === 'coach') {
    return <CoachDashboard />;
  }

  if (profile?.user_type === 'student' || profile?.user_type === 'individual') {
    return <StudentDashboard />;
  }

  // Fallback for users without a profile
  return <StudentDashboard />;
};

// Original App Component (for debate functionality)
const App: React.FC<{ onShowLogin?: () => void }> = ({ onShowLogin }) => {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<'landing' | 'selection' | 'debate' | 'practice'>('landing');
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<any>(null);
  const [session, setSession] = useState<DebateSession | null>(null);
  const [speechNumber, setSpeechNumber] = useState(1);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [whisperService] = useState(() => new WhisperService());
  const [ttsService] = useState(() => new TTSService());
  const finalAnalysisRef = useRef<HTMLDivElement>(null);

  const handleModeSelect = (selectedMode: 'debate' | 'practice', format?: any) => {
    setMode(selectedMode);
    setSelectedFormat(format);
    setShowModeModal(false);
  };

  const handleBackToModeSelection = () => {
    setMode('landing');
    setShowModeModal(true);
    setSession(null);
    setSpeechNumber(1);
    setCurrentSpeaker(null);
    setIsAnalyzing(false);
    setHintsUsed(0);
  };

  const handleBackToLanding = () => {
    setMode('landing');
    setShowModeModal(false);
    setSession(null);
    setSpeechNumber(1);
    setCurrentSpeaker(null);
    setIsAnalyzing(false);
    setHintsUsed(0);
  };

  const handleShowModal = (show: boolean) => {
    setShowModeModal(show);
  };

  const handleHintUsed = () => {
    setHintsUsed(h => h + 1);
  };

  const initializeSession = (topic: string, speakers: Speaker[], people: number, speeches: number, firstSpeaker: 'affirmative' | 'negative') => {
    const debateOrder = createDebateOrder(speakers, speeches, firstSpeaker);
    const newSession: DebateSession = {
      id: `session-${Date.now()}`,
      topic,
      speakers: debateOrder,
      points: [],
      startTime: new Date(),
      hintsUsed: 0,
      firstSpeaker: firstSpeaker,
      summary: 'Debate session started!'
    };
    setSession(newSession);
    setSpeechNumber(1);
    setCurrentSpeaker(debateOrder[0]);
    setMode('debate');
  };

  const createDebateOrder = (speakers: Speaker[], speeches: number, firstSpeaker: 'affirmative' | 'negative'): Speaker[] => {
    const aff = speakers.filter(s => s.team === 'affirmative');
    const neg = speakers.filter(s => s.team === 'negative');
    const sequence: Speaker[] = [];
    
    // Create sequence based on first speaker
    if (firstSpeaker === 'affirmative') {
      for (let i = 0; i < aff.length; i++) {
        sequence.push(aff[i]);
        if (neg[i]) sequence.push(neg[i]);
      }
    } else {
      for (let i = 0; i < neg.length; i++) {
        sequence.push(neg[i]);
        if (aff[i]) sequence.push(aff[i]);
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
    if (!session || !currentSpeaker) return;

    setIsAnalyzing(true);
    try {
      const summary = await AIService.summarizeSpeech(transcript);
      const debatePoint: DebatePoint = {
        id: `point-${Date.now()}`,
        speakerId: currentSpeaker.id,
        speakerName: currentSpeaker.name,
        team: currentSpeaker.team,
        speechNumber,
        mainPoints: summary.mainPoints,
        counterPoints: summary.counterPoints,
        counterCounterPoints: summary.counterCounterPoints,
        impactWeighing: summary.impactWeighing,
        evidence: summary.evidence,
        timestamp: new Date(),
        transcript
      };

      const updatedSession = {
        ...session,
        points: [...session.points, debatePoint],
        hintsUsed
      };

      setSession(updatedSession);

      // Move to next speaker
      const nextSpeechNumber = speechNumber + 1;
      const nextSpeaker = session.speakers[nextSpeechNumber - 1];

      if (nextSpeaker) {
        setSpeechNumber(nextSpeechNumber);
        setCurrentSpeaker(nextSpeaker);
      } else {
        // Debate is complete
        const finalSession = await analyzeWinner(updatedSession);
        setSession(finalSession);
        setShowCompletionPopup(true);
        if (finalAnalysisRef.current) {
          finalAnalysisRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } catch (err) {
      console.error('Error processing speech:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeWinner = async (updatedSession: DebateSession) => {
    try {
      const winnerAnalysis = await AIService.analyzeWinner(updatedSession);
      const finalSession = {
        ...updatedSession,
        winner: {
          team: winnerAnalysis.winner,
          reasoning: winnerAnalysis.keyArguments,
          keyArguments: winnerAnalysis.keyArguments,
          clash: winnerAnalysis.clash,
        },
        endTime: new Date(),
        summary: 'Debate completed! Check the final analysis below.'
      };

      // Save session to database if user is authenticated
      if (user) {
        try {
          await DebateSessionService.saveSession(
            finalSession, 
            user.id, 
            profile?.organization_id || undefined
          );
        } catch (error) {
          console.error('Error saving session to database:', error);
          // Continue even if saving fails
        }
      }

      return finalSession;
    } catch (error) {
      console.error('Error analyzing winner:', error);
      const fallbackSession = {
        ...updatedSession,
        endTime: new Date(),
        summary: 'Debate completed!'
      };

      // Try to save even if analysis failed
      if (user) {
        try {
          await DebateSessionService.saveSession(
            fallbackSession, 
            user.id, 
            profile?.organization_id || undefined
          );
        } catch (error) {
          console.error('Error saving session to database:', error);
        }
      }

      return fallbackSession;
    }
  };

  const handleDebateComplete = () => {
    setShowCompletionPopup(false);
  };

  // Landing page with mode selection modal
  if (mode === 'landing') {
    const features = [
      {
        icon: '🤖',
        title: 'AI Opponents',
        desc: 'Practice with intelligent AI opponents that adapt to your skill level.'
      },
      {
        icon: '📊',
        title: 'Real-time Feedback',
        desc: 'Get instant analysis and feedback on your arguments and delivery.'
      },
      {
        icon: '🎯',
        title: 'Multiple Formats',
        desc: 'Practice in various debate formats including Public Forum, Lincoln-Douglas, and more.'
      },
      {
        icon: '🎤',
        title: 'Practice Any Speech',
        desc: 'Practice any speech of the round: rebuttal, summary, or final focus!'
      }
    ];

    return (
      <>
        <HeroSection 
          setShowModal={handleShowModal}
          features={features}
          onShowLogin={onShowLogin}
        />
        {showModeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ModeSelection 
              onSelectMode={handleModeSelect}
              onBack={handleBackToLanding}
            />
          </div>
        )}
      </>
    );
  }

  // Practice mode
  if (mode === 'practice') {
    return (
      <PracticeMode 
        onBack={handleBackToModeSelection}
        selectedFormat={selectedFormat}
      />
    );
  }

  // Setup panel
  if (!session) {
    return (
      <div>
        <SetupPanel 
          onInitialize={initializeSession} 
          onBack={handleBackToModeSelection}
          selectedFormat={selectedFormat}
        />
      </div>
    );
  }

  // Main debate interface
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900 mb-2">
                ReasynAI - Your Personal AI Coach
              </h1>
              <p className="text-blue-600">
                Topic: {session.topic} | Speech {speechNumber}/{session.speakers.length}
              </p>
            </div>
            <div>
              <button
                onClick={handleBackToModeSelection}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Back to Mode Selection
              </button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Recording Panel and Hint Panel */}
          <div className="lg:col-span-1 space-y-6">
            <RecordingPanel
              currentSpeaker={currentSpeaker}
              speechNumber={speechNumber}
              totalSpeeches={session.speakers.length}
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
              peoplePerTeam={session.speakers.filter(s => s.team === 'affirmative').length}
              speechesPerSpeaker={session.speakers.length / (session.speakers.filter(s => s.team === 'affirmative').length * 2)}
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
          <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 text-center border-2 border-blue-200">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Round Complete!</h2>
            <p className="text-blue-700 mb-6">
              Your debate analysis is ready! Scroll down to see your final results and personalized feedback.
            </p>
            <button
              onClick={handleDebateComplete}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              View Results
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Root component with AuthProvider
const AppRoot: React.FC = () => {
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
};

export default AppRoot; 