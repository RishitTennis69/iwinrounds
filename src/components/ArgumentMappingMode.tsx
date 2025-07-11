import React, { useState } from 'react';
import { Speaker, DebateSession, DebatePoint, ArgumentMap } from '../types';
import { AIService } from '../utils/aiService';
import { SpeechRecognitionService } from '../utils/speechRecognition';
import SetupPanel from './SetupPanel';
import RecordingPanel from './RecordingPanel';
import ArgumentMapPanel from './ArgumentMapPanel';
import FinalAnalysis from './FinalAnalysis';
import { Map, Users, Clock } from 'lucide-react';

interface ArgumentMappingModeProps {
  onBack: () => void;
}

const ArgumentMappingMode: React.FC<ArgumentMappingModeProps> = ({ onBack }) => {
  const [session, setSession] = useState<DebateSession | null>(null);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker | null>(null);
  const [speechNumber, setSpeechNumber] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [speechRecognition] = useState(() => new SpeechRecognitionService());
  const [peoplePerTeam, setPeoplePerTeam] = useState(2);
  const [speechesPerSpeaker, setSpeechesPerSpeaker] = useState(2);
  const [argumentMap, setArgumentMap] = useState<ArgumentMap | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);

  const initializeSession = (topic: string, speakers: Speaker[], people: number, speeches: number, firstSpeaker: 'affirmative' | 'negative') => {
    setPeoplePerTeam(people);
    setSpeechesPerSpeaker(speeches);
    
    const newSession: DebateSession = {
      id: Date.now().toString(),
      topic,
      speakers,
      points: [],
      startTime: new Date(),
      hintsUsed: 0,
      firstSpeaker: firstSpeaker
    };
    setSession(newSession);
    
    // Create debate order that goes through speakers in sequence
    const debateOrder = createDebateOrder(speakers, speeches, firstSpeaker);
    setCurrentSpeaker(debateOrder[0]);

    // Initialize empty argument map
    const newArgumentMap: ArgumentMap = {
      id: `map_${newSession.id}`,
      sessionId: newSession.id,
      nodes: [],
      connections: [],
      lastUpdated: new Date()
    };
    setArgumentMap(newArgumentMap);
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
    if (!session || !currentSpeaker) {
      return;
    }

    setIsAnalyzing(true);
    
    try {
      // Analyze the speech with AI
      const analysis = await AIService.summarizeSpeech(transcript);
      
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

      const updatedSession = {
        ...session,
        points: [...session.points, newPoint],
      };
      
      setSession(updatedSession);
      
      // Update argument map with new speech
      await updateArgumentMap(updatedSession, newPoint);
      
      // Get the debate order and move to next speaker
      const debateOrder = createDebateOrder(session.speakers, speechesPerSpeaker, session.firstSpeaker);
      const nextSpeaker = debateOrder[speechNumber];
      
      setCurrentSpeaker(nextSpeaker);
      setSpeechNumber(speechNumber + 1);
      
      // If we've completed all speeches, analyze the winner
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

  const updateArgumentMap = async (updatedSession: DebateSession, newPoint: DebatePoint) => {
    setIsMapLoading(true);
    try {
      // Extract argument nodes from the new speech
      const { nodes, connections } = await AIService.extractArgumentNodes(
        newPoint.transcript,
        newPoint.speakerId,
        newPoint.speakerName,
        newPoint.team,
        newPoint.speechNumber
      );

      // Add fallacy detection for each node
      const nodesWithFallacies = await Promise.all(
        nodes.map(async (node) => {
          const fallacyAnalysis = await AIService.detectLogicalFallacies(node.content);
          return {
            ...node,
            logicalFallacies: fallacyAnalysis.fallacies.map(f => f.type),
            strength: fallacyAnalysis.overallStrength
          };
        })
      );

      // Update the argument map
      const updatedArgumentMap: ArgumentMap = {
        ...argumentMap!,
        nodes: [...argumentMap!.nodes, ...nodesWithFallacies],
        connections: [...argumentMap!.connections, ...connections],
        lastUpdated: new Date()
      };

      setArgumentMap(updatedArgumentMap);

      // Update session with argument map
      setSession({
        ...updatedSession,
        argumentMap: updatedArgumentMap
      });
    } catch (error) {
      console.error('Error updating argument map:', error);
    } finally {
      setIsMapLoading(false);
    }
  };

  const analyzeWinner = async (updatedSession: DebateSession) => {
    try {
      const analysis = await AIService.analyzeWinner(updatedSession);
      
      // Assign points and generate feedback for each speaker
      const speakersWithPointsAndFeedback = await Promise.all(
        updatedSession.speakers.map(async (speaker) => {
          const points = analysis.speakerPoints[speaker.id] || (25 + Math.floor(Math.random() * 6));
          const speeches = updatedSession.points
            .filter(p => p.speakerId === speaker.id)
            .map(p => p.transcript);
          
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
    } catch (error) {
      console.error('Error analyzing winner:', error);
    }
  };

  const getTeamStats = () => {
    if (!argumentMap) return { affirmative: { nodes: 0, strength: 0 }, negative: { nodes: 0, strength: 0 } };

    const teamStats = { affirmative: { nodes: 0, strength: 0 }, negative: { nodes: 0, strength: 0 } };
    
    argumentMap.nodes.forEach(node => {
      if (node.team === 'affirmative') {
        teamStats.affirmative.nodes++;
        teamStats.affirmative.strength += node.strength;
      } else {
        teamStats.negative.nodes++;
        teamStats.negative.strength += node.strength;
      }
    });

    // Calculate averages
    if (teamStats.affirmative.nodes > 0) {
      teamStats.affirmative.strength = Math.round(teamStats.affirmative.strength / teamStats.affirmative.nodes);
    }
    if (teamStats.negative.nodes > 0) {
      teamStats.negative.strength = Math.round(teamStats.negative.strength / teamStats.negative.nodes);
    }

    return teamStats;
  };

  // Show setup panel if no session
  if (!session) {
    return (
      <div>
        <SetupPanel onInitialize={initializeSession} />
      </div>
    );
  }

  const teamStats = getTeamStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Argument Mapping Mode
              </h1>
              <p className="text-gray-600">
                Topic: {session.topic} | Speech {speechNumber}/{peoplePerTeam * 2 * speechesPerSpeaker}
              </p>
            </div>
            <button
              onClick={onBack}
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Back to Mode Selection
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Recording Panel */}
          <div className="lg:col-span-1">
            <RecordingPanel
              currentSpeaker={currentSpeaker}
              speechNumber={speechNumber}
              onSpeechComplete={handleSpeechComplete}
              speechRecognition={speechRecognition}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Argument Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Live Argument Map</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Aff: {teamStats.affirmative.nodes} nodes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Map className="w-4 h-4" />
                    <span>Neg: {teamStats.negative.nodes} nodes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Total: {argumentMap?.nodes.length || 0}</span>
                  </div>
                </div>
              </div>

              {isMapLoading && (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Updating argument map...</p>
                  </div>
                </div>
              )}

              {argumentMap && argumentMap.nodes.length > 0 && !isMapLoading && (
                <ArgumentMapPanel
                  session={{
                    ...session,
                    argumentMap: argumentMap
                  }}
                  className="h-96"
                />
              )}

              {argumentMap && argumentMap.nodes.length === 0 && !isMapLoading && (
                <div className="text-center text-gray-600 py-12">
                  <Map className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Start recording speeches to build the argument map</p>
                </div>
              )}
            </div>
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
};

export default ArgumentMappingMode; 