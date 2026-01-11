import { GameState } from './types';
import { generateMockRequest, generateHardcodedResponse, analyzeHardcodedAnswer } from './mockData';
import { soundManager } from './utils/sounds';

export class GameStateManager {
  private state: GameState;
  private spawnInterval: number | null = null;
  private gameLoopInterval: number | null = null;
  private onStateChange: (state: GameState) => void;
  private requestIdCounter = 0;
  private isPaused = false;

  constructor(onStateChange: (state: GameState) => void) {
    this.state = {
      activeRequests: [],
      score: 0,
      gameTimer: 0,
      difficultyLevel: 1,
      lives: 5,
      isGameOver: false,
      isShowingAnalysis: false,
      questionsShown: 0,
    };
    this.onStateChange = onStateChange;
    this.notifyStateChange();
  }

  startGame() {
    this.state.isGameOver = false;
    this.state.gameTimer = 0;
    this.state.score = 0;
    this.state.lives = 5;
    this.state.difficultyLevel = 1;
    this.state.activeRequests = [];
    this.state.currentAnalysis = undefined;
    this.state.isShowingAnalysis = false;
    this.state.questionsShown = 0;
    this.requestIdCounter = 0;
    this.isPaused = false;
    
    // Spawn initial request (only one at a time) - async, don't wait
    this.spawnRequest();
    soundManager.playRequestSpawn();
    
    // Start game loop
    this.gameLoopInterval = window.setInterval(() => {
      this.updateGameLoop();
    }, 100); // Update every 100ms for smooth timers
    
    this.notifyStateChange();
  }

  pauseGame() {
    this.isPaused = true;
  }

  resumeGame() {
    this.isPaused = false;
  }

  private updateGameLoop() {
    if (this.state.isGameOver || this.isPaused) return;
    
    this.state.gameTimer += 0.1;
    
    // Update difficulty level (increases every 10 seconds)
    this.state.difficultyLevel = Math.floor(this.state.gameTimer / 10) + 1;
    
    // Update request timers
    this.state.activeRequests = this.state.activeRequests.map(request => {
      const elapsed = 0.1; // 100ms
      const newTimeRemaining = Math.max(0, request.timeRemaining - elapsed);
      
      // Check if request expired
      if (newTimeRemaining <= 0 && request.timeRemaining > 0 && !request.hasExpired) {
        this.handleRequestExpired(request.id);
      }
      
      return {
        ...request,
        timeRemaining: newTimeRemaining,
      };
    });
    
    this.notifyStateChange();
  }

  private async spawnRequest() {
    if (this.state.isGameOver || this.state.isShowingAnalysis) return;
    
    // Only spawn if no active requests (one at a time)
    if (this.state.activeRequests.length > 0) return;
    
    try {
      // hardcoded request generation
      const newRequest = await generateMockRequest(
        `req-${this.requestIdCounter++}`,
        this.state.difficultyLevel
      );
      
      // hardcoded time limit calculation: harder = less time
      // Difficulty 1: 50s, Difficulty 2: 45s, Difficulty 3: 40s, Difficulty 4: 35s, Difficulty 5+: 30s
      newRequest.timeLimit = Math.max(30, 55 - (this.state.difficultyLevel * 2));
      newRequest.timeRemaining = newRequest.timeLimit;
      
      this.state.activeRequests.push(newRequest);
      this.state.questionsShown++;
      this.notifyStateChange();
    } catch (error) {
      console.error('Error spawning request:', error);
      // Retry after a delay instead of ending the game immediately
      setTimeout(() => {
        if (!this.state.isGameOver && !this.state.isShowingAnalysis) {
          this.spawnRequest();
        }
      }, 1000);
    }
  }

  showNextCard() {
    this.state.isShowingAnalysis = false;
    this.state.currentAnalysis = undefined;
    this.spawnRequest(); // Async, but we don't need to wait
    this.notifyStateChange();
  }

  skipRequest(requestId: string) {
    const request = this.state.activeRequests.find(r => r.id === requestId);
    if (!request || request.hasExpired || this.state.isShowingAnalysis) return;
    
    this.removeRequest(requestId);
    this.state.score = Math.max(0, this.state.score - 5);
    soundManager.playSkip();
    setTimeout(() => {
      this.spawnRequest();
    }, 300);
    this.notifyStateChange();
  }

  async submitAnswer(requestId: string, answer: string) {
    const request = this.state.activeRequests.find(r => r.id === requestId);
    if (!request || request.hasExpired || this.state.isShowingAnalysis) return;
    
    if (!answer || answer.trim().length === 0) return;
    
    const questionText = request.text;
    const questionType = request.type;
    const questionDifficulty = request.difficulty;
    
    this.removeRequest(requestId);
    soundManager.playSubmit();
    this.state.isShowingAnalysis = true;
    this.notifyStateChange();
    
    let exampleResponse = '';
    try {
      console.log('Generating AI response for question:', questionText);
      exampleResponse = await generateHardcodedResponse(questionText, questionType, questionDifficulty);
      console.log('AI response generated, length:', exampleResponse.length);
      
      console.log('Analyzing user answer:', answer.trim());
      const analysis = await analyzeHardcodedAnswer(answer.trim(), exampleResponse, questionText);
      console.log('Analysis complete, total score:', analysis.totalScore);
      
      this.state.score += analysis.totalScore;
      this.state.currentAnalysis = analysis;
      
      soundManager.playAnalysisComplete();
      this.notifyStateChange();
    } catch (error) {
      console.error('Error submitting answer:', error);
      // Use default analysis to prevent errors from breaking the game
      this.state.score += 500;
      this.state.currentAnalysis = {
        totalScore: 600,
        aiResponse: exampleResponse || 'Analysis unavailable',
        userAnswer: answer.trim(),
        metrics: {
          formalness: { score: 100, max: 200, details: 'Analysis temporarily unavailable' },
          aiLikeness: { score: 150, max: 300, details: 'Analysis temporarily unavailable' },
          grammar: { score: 100, max: 200, details: 'Analysis temporarily unavailable' },
          structure: { score: 75, max: 150, details: 'Analysis temporarily unavailable' },
          vocabulary: { score: 75, max: 150, details: 'Analysis temporarily unavailable' },
          topicRelevance: { score: 100, max: 200, details: 'Analysis temporarily unavailable' }
        }
      };
      soundManager.playAnalysisComplete();
      this.notifyStateChange();
    }
  }

  private handleRequestExpired(requestId: string) {
    const request = this.state.activeRequests.find(r => r.id === requestId);
    if (!request || request.hasExpired) return;
    
    // Mark as expired and trigger shake animation
    request.hasExpired = true;
    this.notifyStateChange();
    
    // Remove after shake animation
    setTimeout(() => {
      this.state.lives--;
      this.removeRequest(requestId);
      
      // Game over when lives reach 0
      if (this.state.lives <= 0) {
        this.endGame();
      } else {
        // Spawn next card after a brief delay
        setTimeout(() => {
          this.spawnRequest();
        }, 1000);
      }
    }, 500);
  }

  private removeRequest(requestId: string) {
    this.state.activeRequests = this.state.activeRequests.filter(
      r => r.id !== requestId
    );
    this.notifyStateChange();
  }

  private endGame() {
    this.state.isGameOver = true;
    if (this.spawnInterval) {
      clearTimeout(this.spawnInterval);
      this.spawnInterval = null;
    }
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
      this.gameLoopInterval = null;
    }
    soundManager.playGameOver();
    this.notifyStateChange();
  }

  stopGame() {
    if (this.spawnInterval) {
      clearTimeout(this.spawnInterval);
    }
    if (this.gameLoopInterval) {
      clearInterval(this.gameLoopInterval);
    }
  }

  getState(): GameState {
    return { ...this.state };
  }

  private notifyStateChange() {
    this.onStateChange(this.getState());
  }
}
