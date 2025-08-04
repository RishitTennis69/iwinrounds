export interface Speaker {
  id: string;
  name: string;
  team: 'affirmative' | 'negative';
  points: number;
  speakerNumber?: number; // 1st or 2nd speaker
  feedback?: string | {
    strengths: string[]; // Minimum 1 strength
    areasForImprovement: string[]; // Minimum 2 areas for improvement
    overallAssessment: string; // Brief overall assessment
    delivery?: {
      wordsPerMinute: number;
      fillerWords: {
        count: number;
        types: string[];
        percentage: number;
      };
      paceAssessment: string;
      fillerAssessment: string;
    };
  };
}

// User and Organization types
export interface User {
  id: string;
  email: string;
  user_type: 'individual' | 'business_admin' | 'coach' | 'student';
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: 'admin' | 'coach' | 'student';
  created_at: string;
  user?: User;
  organization?: Organization;
}

export interface InviteCode {
  id: string;
  organization_id: string;
  code: string;
  role: 'coach' | 'student';
  created_by: string;
  expires_at: string;
  used_by?: string;
  used_at?: string;
  created_at: string;
}

export interface StudentActivity {
  user_id: string;
  user_name: string;
  user_email: string;
  total_debates: number;
  recent_debates: DebateSession[];
  overall_feedback: {
    strengths: string[];
    areasForImprovement: string[];
    averageScore: number;
  };
  last_activity: string;
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

// New types for argument mapping
export interface ArgumentNode {
  id: string;
  type: 'claim' | 'evidence' | 'reasoning' | 'counter-claim' | 'rebuttal';
  content: string;
  speakerId: string;
  speakerName: string;
  team: 'affirmative' | 'negative';
  speechNumber: number;
  timestamp: Date;
  strength: number; // 1-10 scale
  evidenceQuality?: number; // 1-10 scale for evidence nodes
  logicalFallacies?: string[]; // List of detected fallacies
  parentId?: string; // ID of parent argument this supports or counters
  childrenIds: string[]; // IDs of arguments that support or counter this
  position: {
    x: number;
    y: number;
  };
  summary?: string; // Short AI-generated summary for display
}

export interface ArgumentMap {
  id: string;
  sessionId: string;
  nodes: ArgumentNode[];
  connections: ArgumentConnection[];
  lastUpdated: Date;
}

export interface ArgumentConnection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: 'supports' | 'counters' | 'rebuts';
  strength: number; // 1-10 scale
}

export interface LogicalFallacy {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
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
    keyArguments?: string;
    clash?: string;
  };
  summary?: string;
  hintsUsed: number; // Track hints used per round
  firstSpeaker: 'affirmative' | 'negative'; // Track which team speaks first
  judgingStyle?: 'lay' | 'flow' | 'default'; // Track judging style preference
  feedback?: {
    strengths: string[];
    areasForImprovement: string[];
    specificAdvice: string;
    overallScore: number;
    summary: string;
  };
  argumentMap?: ArgumentMap; // New field for argument mapping
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