export type RequestType = 'FACT' | 'MATH' | 'CREATIVE' | 'EMOTIONAL';

export interface ChatHistory {
  chatName: string;
  date: string;
}

export interface Request {
  id: string;
  type: RequestType;
  difficulty: number;
  timeLimit: number;
  text: string;
  timeRemaining: number;
  hasExpired?: boolean;
  userName?: string;
  requestDate?: string;
  requestTime?: string;
  chatHistory?: ChatHistory[];
}

export interface AnalysisResult {
  totalScore: number; // Out of 1200
  aiResponse: string;
  userAnswer: string;
  metrics: {
    formalness: { score: number; max: number; details: string };
    aiLikeness: { score: number; max: number; details: string };
    grammar: { score: number; max: number; details: string };
    structure: { score: number; max: number; details: string };
    vocabulary: { score: number; max: number; details: string };
    topicRelevance: { score: number; max: number; details: string };
  };
}

export interface GameState {
  activeRequests: Request[];
  score: number;
  gameTimer: number;
  difficultyLevel: number;
  lives: number;
  isGameOver: boolean;
  currentAnalysis?: AnalysisResult; // Show analysis before next card
  isShowingAnalysis: boolean;
  questionsShown: number; // Track number of questions shown
}
