import { RequestType } from './types';
import { generateQuestion, generateAIResponse, analyzeAnswerForAI } from './api/aiApi';

const FIRST_NAMES = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Sage', 'River', 'Blake', 'Cameron', 'Dakota', 'Emery', 'Finley', 'Harper', 'Hayden', 'Jamie', 'Kai', 'Logan', 'Noah', 'Parker', 'Phoenix', 'Reese', 'Rowan', 'Skylar', 'Tyler', 'Zion'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

function generateRandomUser() {
  const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

function generateRandomDate() {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 30);
  const date = new Date(now);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function formatDate(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function generateChatHistory(): import('./types').ChatHistory[] {
  const chatNames = [
    'Project Planning',
    'Code Review',
    'Research Help',
    'Writing Assistance',
    'Problem Solving',
    'Learning Support',
    'Creative Ideas',
    'Technical Questions',
    'Data Analysis',
    'Content Creation',
    'Strategy Discussion',
    'Troubleshooting',
  ];
  
  const count = Math.floor(Math.random() * 5) + 3;
  const history: import('./types').ChatHistory[] = [];
  
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 60);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    history.push({
      chatName: chatNames[Math.floor(Math.random() * chatNames.length)],
      date: formatDate(date),
    });
  }
  
  // Sort by date (newest first) - use timestamp comparison instead of Date parsing
  return history.sort((a, b) => {
    try {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
        return 0;
      }
      return dateB.getTime() - dateA.getTime();
    } catch {
      return 0;
    }
  });
}

export async function generateMockRequest(
  id: string,
  difficultyLevel: number,
  type?: RequestType
): Promise<import('./types').Request> {
  const types: RequestType[] = ['FACT', 'MATH', 'CREATIVE', 'EMOTIONAL'];
  const selectedType = type || types[Math.floor(Math.random() * types.length)];
  
  const baseDifficulty = Math.min(5, Math.max(1, Math.floor(difficultyLevel / 2) + 1));
  
  const questionText = await generateQuestion(selectedType, baseDifficulty);
  
  const timeLimit = Math.max(25, 50 - (difficultyLevel * 2));
  
  const requestDate = generateRandomDate();
  
  return {
    id,
    type: selectedType,
    difficulty: baseDifficulty,
    timeLimit,
    text: questionText,
    timeRemaining: timeLimit,
    userName: generateRandomUser(),
    requestDate: formatDate(requestDate),
    requestTime: formatTime(requestDate),
    chatHistory: generateChatHistory(),
  };
}

export async function generateHardcodedResponse(question: string, type: RequestType, difficulty: number): Promise<string> {
  return await generateAIResponse(question, type, difficulty);
}

export async function analyzeHardcodedAnswer(
  userAnswer: string,
  exampleResponse: string,
  question: string
): Promise<import('./types').AnalysisResult> {
  const analysis = await analyzeAnswerForAI(userAnswer, exampleResponse, question);
  
  return {
    totalScore: analysis.totalScore,
    aiResponse: exampleResponse,
    userAnswer: userAnswer.trim(),
    metrics: analysis.metrics
  };
}
