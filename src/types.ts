export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: any;
}

export interface AnalysisResult {
  biggestFriction: string;
  understanding: string;
  betaSimulation: string;
  criticalProblems: Array<{
    priority: 'High' | 'Medium' | 'Low';
    problem: string;
    impact: string;
    fix: string;
  }>;
  marketValidation: string;
  feasibilityAnalysis: string;
  lessGenericAnalysis: string;
  nextActions: string[];
}

export interface Analysis {
  id: string;
  userId: string;
  title: string;
  description?: string;
  inputTypes: ('image' | 'video' | 'audio' | 'text')[];
  mediaUrls: string[];
  result?: AnalysisResult;
  createdAt: any;
  status: 'pending' | 'completed' | 'failed';
  isSaved?: boolean;
  isPublic?: boolean;
}
