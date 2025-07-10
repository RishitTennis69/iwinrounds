export interface Speaker {
  id: string;
  name: string;
  team: 'affirmative' | 'negative';
  points: number;
  speakerNumber?: number; // 1st or 2nd speaker
  feedback?: string;
}

export interface DebatePoint {
  id: string;
  speakerId: string;
  speakerName: string;
  team: 'affirmative' | 'negative';
  speechNumber: number;
  mainPoints: string[];
  counterPoints: string[];
  counterCounterPoints: string[];
  impactWeighing: string;
  evidence: string[]; // New field for evidence and sources
  timestamp: Date;
  transcript: string;
}

export interface DebateSession {
  id: string;
  topic: string;
  speakers: Speaker[];
  points: DebatePoint[];
  startTime: Date;
  endTime?: Date;
  winner?: {
    team: 'affirmative' | 'negative';
    reasoning: string;
  };
  summary?: string;
  hintsUsed: number; // Track hints used per round
  feedback?: {
    strengths: string[];
    areasForImprovement: string[];
    specificAdvice: string;
    overallScore: number;
    summary: string;
  };
}

export interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob?: Blob;
  transcript: string;
}

export interface HintResponse {
  type: 'cross-examination' | 'rebuttal';
  content: string;
  targetArgument?: string;
} 