import React, { useState, useEffect, useRef } from 'react';
import { Speaker, DebatePoint, DebateSession } from './types';
import { SimpleSpeechService } from './utils/simpleSpeechService';
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
import { ArrowLeft } from 'lucide-react';

// Global navigation state
let globalNavigationTarget: 'debate' | 'practice' | null = null;

// Main App Component with Authentication
const AppWithAuth: React.FC = () => {
  console.log('🔍 AppWithAuth: Component rendering');
  const { user, profile, loading } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [currentView, setCurrentView] = useState<'dashboard' | 'debate' | 'practice'>('dashboard');
  const [showModeSelection, setShowModeSelection] = useState(false);

  console.log('🔍 AppWithAuth: Auth state:', { 
    user: !!user, 
    profile: !!profile, 
    loading,
    showLogin,
    currentView,
    showModeSelection
  });

  // Listen for custom navigation events from StudentDashboard
  useEffect(() => {
    console.log('🔍 AppWithAuth: Setting up navigateToMode event listener');
    
    const handleNavigateToMode = (event: CustomEvent) => {
      console.log('🔍 AppWithAuth: Received navigateToMode event:', event.detail);
      const { mode } = event.detail;
      
      if (mode === 'debate') {
        console.log('🔍 AppWithAuth: Navigating to debate mode via event');
        globalNavigationTarget = 'debate';
        setCurrentView('debate');
      } else if (mode === 'practice') {
        console.log('🔍 AppWithAuth: Navigating to practice mode via event');
        globalNavigationTarget = 'practice';
        setCurrentView('practice');
      }
    };

    console.log('🔍 AppWithAuth: Adding navigateToMode event listener to window');
    window.addEventListener('navigateToMode', handleNavigateToMode as EventListener);
    console.log('🔍 AppWithAuth: Event listener added successfully');
    
    return () => {
      console.log('🔍 AppWithAuth: Removing navigateToMode event listener');
      window.removeEventListener('navigateToMode', handleNavigateToMode as EventListener);
    };
  }, []);

  // Fallback timeout for loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        console.log('🔍 AppWithAuth: Loading timeout reached, forcing fallback');
        setLoadingTimeout(true);
      }, 8000); // 8 second timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading && !loadingTimeout) {
    console.log('🔍 AppWithAuth: Showing loading spinner');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // If loading times out, show the app anyway
  if (loadingTimeout) {
    console.log('🔍 AppWithAuth: Loading timed out, showing app anyway');
  }

  console.log('🔍 AppWithAuth: Loading complete, checking user state');

  // If user is not logged in, show landing page with login popup
  if (!user) {
    console.log('🔍 AppWithAuth: No user, showing landing page');
    return (
      <>
        <App onShowLogin={() => setShowLogin(true)} />
        {showLogin && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <LoginForm 
              onSuccess={() => setShowLogin(false)} 
              onClose={() => setShowLogin(false)}
            />
          </div>
        )}
      </>
    );
  }

  // If user is logged in but profile is not loaded yet, show loading
  if (!profile) {
    console.log('🔍 AppWithAuth: User logged in but profile not loaded, showing loading');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-slate-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  console.log('🔍 AppWithAuth: User logged in, checking currentView:', currentView);

  // Route based on currentView and user type
  if (currentView === 'debate') {
    console.log('🔍 AppWithAuth: Rendering debate mode');
    return <App 
      onShowLogin={() => setShowLogin(true)} 
      onBackToModeSelection={() => {
        setCurrentView('dashboard');
        setShowModeSelection(false); // Don't show mode selection popup
        globalNavigationTarget = null;
      }}
    />;
  }
  
  if (currentView === 'practice') {
    console.log('🔍 AppWithAuth: Rendering practice mode');
    return <App 
      onShowLogin={() => setShowLogin(true)} 
      onBackToModeSelection={() => {
        setCurrentView('dashboard');
        setShowModeSelection(false); // Don't show mode selection popup
        globalNavigationTarget = null;
      }}
    />;
  }

  // Default to dashboard based on user type
  console.log('🔍 AppWithAuth: Profile data:', {
    user_type: profile?.user_type,
    organization_id: profile?.organization_id,
    email: profile?.email,
    first_name: profile?.first_name
  });

  if (profile?.user_type === 'business_admin' || profile?.user_type === 'coach') {
    console.log('🔍 AppWithAuth: Routing to CoachDashboard - user_type:', profile?.user_type);
    return <CoachDashboard />;
  }
  
  if (profile?.user_type === 'student' || profile?.user_type === 'individual') {
    console.log('🔍 AppWithAuth: Routing to StudentDashboard - user_type:', profile?.user_type);
    return (
      <>
        <StudentDashboard />
        {showModeSelection && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ModeSelection 
              onSelectMode={(mode, format) => {
                setShowModeSelection(false);
                if (mode === 'debate') {
                  globalNavigationTarget = 'debate';
                  setCurrentView('debate');
                } else if (mode === 'practice') {
                  globalNavigationTarget = 'practice';
                  setCurrentView('practice');
                }
              }}
              onBack={() => setShowModeSelection(false)}
            />
          </div>
        )}
      </>
    );
  }
  
  // If profile exists but user_type is not recognized, show error or redirect to landing
  console.log('🔍 AppWithAuth: Unknown user_type, redirecting to landing page');
  return (
    <>
      <App onShowLogin={() => setShowLogin(true)} />
      {showLogin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <LoginForm 
            onSuccess={() => setShowLogin(false)} 
            onClose={() => setShowLogin(false)}
          />
        </div>
      )}
    </>
  );
};

// Original App Component (for debate functionality)
const App: React.FC<{ onShowLogin?: () => void; onBackToModeSelection?: () => void }> = ({ onShowLogin, onBackToModeSelection }) => {
  console.log('🔍 App: Component rendering with onShowLogin:', !!onShowLogin);
  
  const [mode, setMode] = useState<'landing' | 'selection' | 'debate' | 'practice'>('landing');
  const [showModeModal, setShowModeModal] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<any>(null);
  const [showFormatSelection, setShowFormatSelection] = useState(false);
  const [session, setSession] = useState<DebateSession | null>(null);
  const [speechNumber, setSpeechNumber] = useState(1);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [whisperService] = useState(() => new SimpleSpeechService());
  const [ttsService] = useState(() => new TTSService());
  const finalAnalysisRef = useRef<HTMLDivElement>(null);

  const { user, profile } = useAuth();

  console.log('🔍 App: State initialized:', { 
    mode, 
    showModeModal, 
    selectedFormat: !!selectedFormat,
    user: !!user,
    profile: !!profile
  });

  // Debate formats for debate mode
  const DEBATE_FORMATS = [
    {
      name: 'Public Forum',
      description: '2v2 format with constructive speeches and rebuttals',
      peoplePerTeam: 2,
      speechesPerSpeaker: 1,
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
      speechesPerSpeaker: 2,
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
    console.log('🔍 App: handleFormatSelect called with format:', format);
    setSelectedFormat(format);
    setShowFormatSelection(false);
  };

  // Clear all setup state when going back to mode selection
  const clearSetupState = () => {
    setSelectedFormat(null);
    setShowFormatSelection(false);
    setSession(null);
    setSpeechNumber(1);
    setCurrentSpeaker(null);
    setIsAnalyzing(false);
    setHintsUsed(0);
    setShowCompletionPopup(false);
    globalNavigationTarget = null;
  };

  // Check for navigation targets from localStorage
  useEffect(() => {
    const navigationTarget = localStorage.getItem('navigationTarget');
    if (navigationTarget) {
      console.log('🔍 App: Found navigation target:', navigationTarget);
      localStorage.removeItem('navigationTarget'); // Clear it
      
      if (navigationTarget === 'debate') {
        console.log('🔍 App: Navigating to debate mode');
        setMode('debate');
      } else if (navigationTarget === 'practice') {
        console.log('🔍 App: Navigating to practice mode');
        setMode('practice');
      }
    }
  }, []);

  // Check if we should start in a specific mode based on URL or other indicators
  useEffect(() => {
    // Check if we're coming from AppWithAuth navigation
    const urlParams = new URLSearchParams(window.location.search);
    const viewMode = urlParams.get('view');
    
    if (viewMode === 'practice') {
      console.log('🔍 App: Starting in practice mode from URL');
      setMode('practice');
      setSelectedFormat(null);
    } else if (viewMode === 'debate') {
      console.log('🔍 App: Starting in debate mode from URL');
      setMode('debate');
      setSelectedFormat(null);
    }
  }, []);

  // Check global navigation target
  useEffect(() => {
    if (globalNavigationTarget) {
      console.log('🔍 App: Found global navigation target:', globalNavigationTarget);
      setMode(globalNavigationTarget);
      setSelectedFormat(null);
      globalNavigationTarget = null; // Clear it after use
    }
  }, []);

  // Log mode changes
  useEffect(() => {
    console.log('🔍 App: Mode changed to:', mode);
  }, [mode]);

  const handleModeSelect = (selectedMode: 'debate' | 'practice', format?: any) => {
    console.log('🔍 App: handleModeSelect called with selectedMode:', selectedMode, 'and format:', format);
    setMode(selectedMode);
    setSelectedFormat(format);
    setShowModeModal(false);
  };

  const handleBackToModeSelection = () => {
    console.log('🔍 App: handleBackToModeSelection called');
    // Clear all setup state
    clearSetupState();
    
    // Call the callback to go back to mode selection
    if (onBackToModeSelection) {
      onBackToModeSelection();
    } else {
      // Fallback: navigate back to mode selection popup instantly
      setMode('landing');
      setShowModeModal(true);
    }
  };

  const handleBackToLanding = () => {
    console.log('🔍 App: handleBackToLanding called');
    // Clear all setup state
    clearSetupState();
    setMode('landing');
    setShowModeModal(false);
  };

  const handleShowModal = (show: boolean) => {
    console.log('🔍 App: handleShowModal called with show:', show);
    setShowModeModal(show);
  };

  const handleHintUsed = () => {
    console.log('🔍 App: handleHintUsed called');
    setHintsUsed(h => h + 1);
  };

  const handleNavigateToDebate = () => {
    console.log('🔍 App: handleNavigateToDebate called');
    setMode('debate');
    setShowModeModal(false);
  };

  const handleNavigateToPractice = () => {
    console.log('🔍 App: handleNavigateToPractice called');
    setMode('practice');
    setShowModeModal(false);
  };

  const initializeSession = (topic: string, speakers: Speaker[], people: number, speeches: number, firstSpeaker: 'affirmative' | 'negative') => {
    console.log('🔍 App: initializeSession called with topic:', topic, 'speakers:', speakers, 'people:', people, 'speeches:', speeches, 'firstSpeaker:', firstSpeaker);
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
    console.log('🔍 App: createDebateOrder called with speakers:', speakers, 'speeches:', speeches, 'firstSpeaker:', firstSpeaker);
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
    console.log('🔍 App: handleSpeechComplete called with transcript:', transcript);
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
      console.error('🔍 App: Error processing speech:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeWinner = async (updatedSession: DebateSession) => {
    console.log('🔍 App: analyzeWinner called with updatedSession:', updatedSession);
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
          console.log('🔍 App: Debate session saved successfully to database');
        } catch (error) {
          console.error('🔍 App: Error saving session to database:', error);
          // Continue even if saving fails
        }
      }

      return finalSession;
    } catch (error) {
      console.error('🔍 App: Error analyzing winner:', error);
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
          console.error('🔍 App: Error saving session to database:', error);
        }
      }

      return fallbackSession;
    }
  };

  const handleDebateComplete = () => {
    console.log('🔍 App: handleDebateComplete called');
    setShowCompletionPopup(false);
  };

  // Landing page with mode selection modal
  if (mode === 'landing') {
    console.log('🔍 App: Rendering landing page');
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
    console.log('🔍 App: Rendering practice mode');
    console.log('🔍 App: selectedFormat in practice mode:', selectedFormat);
    console.log('🔍 App: About to render PracticeMode component');
    return (
      <PracticeMode 
        onBack={handleBackToModeSelection}
        selectedFormat={selectedFormat}
      />
    );
  }

  // Format selection for debate mode
  if (mode === 'debate' && !selectedFormat && !showFormatSelection) {
    console.log('🔍 App: Rendering format selection for debate mode');
    // Add a small delay to make the transition feel more natural
    setTimeout(() => {
      setShowFormatSelection(true);
    }, 100);
  }

  // Format selection step
  if (showFormatSelection) {
    console.log('🔍 App: Rendering format selection step');
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-5xl relative border border-slate-200/40 animate-in slide-in-from-bottom-4 duration-500">
          {/* Back Button - moved to top right to avoid overlap */}
          <button
            onClick={handleBackToModeSelection}
            className="absolute top-6 right-6 flex items-center space-x-2 text-slate-600 hover:text-slate-800 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-2 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="text-center mb-10 pt-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-700 to-blue-700 bg-clip-text text-transparent mb-3">Choose Debate Format</h1>
            <p className="text-slate-600 text-lg">Select a standard format or customize your own settings</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {/* Standard Formats */}
            {DEBATE_FORMATS.map((format) => (
              <button
                key={format.name}
                onClick={() => handleFormatSelect(format)}
                className="bg-gradient-to-br from-slate-50/90 to-blue-50/90 backdrop-blur-sm border-2 border-slate-200/60 rounded-2xl p-6 hover:border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
              >
                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-slate-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">{format.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-700 transition-colors">
                    {format.name}
                  </h3>
                  <p className="text-slate-700 text-sm mb-4 leading-relaxed">{format.description}</p>
                  <div className="space-y-2 text-xs text-slate-600">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-500">👥</span>
                      <span>{format.peoplePerTeam === 1 ? '1v1' : `${format.peoplePerTeam}v${format.peoplePerTeam}`}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-500">🎤</span>
                      <span>{format.speechesPerSpeaker} speech{format.speechesPerSpeaker > 1 ? 'es' : ''} per speaker</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-500">🥇</span>
                      <span>{format.firstSpeaker === 'affirmative' ? 'Aff' : 'Neg'} speaks first</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <div className="font-semibold text-slate-800">⏱️ Prep Time: {format.prepTime} min</div>
                      <div className="text-slate-600 mt-1">
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
              className="bg-gradient-to-br from-blue-50/90 to-indigo-50/90 backdrop-blur-sm border-2 border-blue-200/60 rounded-2xl p-6 hover:border-blue-400 hover:shadow-xl hover:scale-105 transition-all duration-300 text-left group relative overflow-hidden"
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              
              <div className="relative z-10">
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">⚙️</div>
                <h3 className="text-xl font-bold text-blue-900 mb-3 group-hover:text-blue-700 transition-colors">
                  Custom Format
                </h3>
                <p className="text-blue-700 text-sm mb-4 leading-relaxed">
                  Create your own debate format with custom settings
                </p>
                <div className="space-y-2 text-xs text-blue-600">
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">🎛️</span>
                    <span>Customize team sizes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">🎤</span>
                    <span>Set speech counts</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-blue-500">⚡</span>
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

  // Setup panel
  if (!session) {
    console.log('🔍 App: Rendering SetupPanel');
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
  console.log('🔍 App: Rendering main debate interface');
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
  console.log('🔍 AppRoot: Component rendering');
  return (
    <AuthProvider>
      <AppWithAuth />
    </AuthProvider>
  );
};

export default AppRoot; 