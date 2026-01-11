import { useEffect, useState, useRef } from 'react';
import { GameState } from '../types';
import { GameStateManager } from '../gameState';
import RequestCard from './RequestCard';
import AnalysisScreen from './AnalysisScreen';
import { useSettings } from '../contexts/SettingsContext';
import { useStatistics } from '../contexts/StatisticsContext';
import { soundManager } from '../utils/sounds';

interface GameProps {
  onBackToHome?: () => void;
}

export default function Game({ onBackToHome }: GameProps) {
  const { settings } = useSettings();
  const statistics = useStatistics();
  const recordGame = statistics?.recordGame || (() => {});
  const updateStreak = statistics?.updateStreak || (() => {});
  const checkAchievements = statistics?.checkAchievements || (() => {});
  const [gameState, setGameState] = useState<GameState | null>(null);
  const gameManagerRef = useRef<GameStateManager | null>(null);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningFading, setWarningFading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [combo, setCombo] = useState(0);
  const [showCombo, setShowCombo] = useState(false);
  const [showAchievementNotification, setShowAchievementNotification] = useState<{ name: string; icon: string } | null>(null);
  const scoreRef = useRef<HTMLDivElement>(null);
  const gameOverRef = useRef<HTMLDivElement>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const questionsAnsweredRef = useRef(0);
  const correctAnswersRef = useRef(0);
  const perfectAnswersRef = useRef(0);

  useEffect(() => {
    soundManager.setSoundEffectsEnabled(settings.soundEffects);
    soundManager.setBackgroundMusicEnabled(settings.backgroundMusic);
  }, [settings.soundEffects, settings.backgroundMusic]);

  useEffect(() => {
    const handleAchievementUnlock = (event: CustomEvent) => {
      const achievements = event.detail;
      if (achievements && achievements.length > 0) {
        const first = achievements[0];
        setShowAchievementNotification({ name: first.name, icon: first.icon });
        setTimeout(() => setShowAchievementNotification(null), 3000);
      }
    };

    window.addEventListener('achievement-unlocked', handleAchievementUnlock as EventListener);
    return () => window.removeEventListener('achievement-unlocked', handleAchievementUnlock as EventListener);
  }, []);

  useEffect(() => {
    if (gameState?.currentAnalysis) {
      questionsAnsweredRef.current++;
      const scorePercentage = (gameState.currentAnalysis.totalScore / 1200) * 100;
      if (scorePercentage === 100) {
        perfectAnswersRef.current++;
      }
      if (scorePercentage >= 60) {
        correctAnswersRef.current++;
        const newCombo = combo + 1;
        setCombo(newCombo);
        setShowCombo(true);
        if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current);
        comboTimeoutRef.current = setTimeout(() => {
          setShowCombo(false);
          if (newCombo > 0) {
            try {
              updateStreak(true);
            } catch (error) {
              console.error('Error updating streak:', error);
            }
          }
        }, 2000);
      } else {
        setCombo(0);
        try {
          updateStreak(false);
        } catch (error) {
          console.error('Error updating streak:', error);
        }
      }
    }
  }, [gameState?.currentAnalysis, combo, updateStreak]);

  useEffect(() => {
    if (gameState?.isGameOver) {
      try {
        recordGame(
          gameState.score,
          gameState.gameTimer,
          gameState.difficultyLevel,
          questionsAnsweredRef.current,
          correctAnswersRef.current,
          perfectAnswersRef.current
        );
        checkAchievements();
      } catch (error) {
        console.error('Error recording game stats:', error);
      }
      questionsAnsweredRef.current = 0;
      correctAnswersRef.current = 0;
      perfectAnswersRef.current = 0;
      setCombo(0);
    }
  }, [gameState?.isGameOver, recordGame, checkAchievements]);

  useEffect(() => {
    if (!gameState) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !gameState.isGameOver && !gameState.isShowingAnalysis) {
        if (isPaused) {
          setIsPaused(false);
          setShowPauseMenu(false);
          gameManagerRef.current?.resumeGame();
        } else {
          setIsPaused(true);
          setShowPauseMenu(true);
          gameManagerRef.current?.pauseGame();
        }
      }
      if (e.key === 'h' || e.key === 'H') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          setShowHelp(!showHelp);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused, gameState, showHelp]);

  useEffect(() => {
    if (gameState && gameState.lives <= 2 && !gameState.isShowingAnalysis) {
      setShowWarning(true);
      setWarningFading(false);
      
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
      
      warningTimeoutRef.current = setTimeout(() => {
        setWarningFading(true);
        setTimeout(() => {
          setShowWarning(false);
        }, 1000);
      }, 5000);
    } else {
      setShowWarning(false);
      setWarningFading(false);
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    }
    
    return () => {
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, [gameState?.lives, gameState?.isShowingAnalysis]);


  const takeScreenshot = async (auto: boolean = true) => {
    try {
      if (!auto) {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          try {
            const stream = await navigator.mediaDevices.getDisplayMedia({
              video: { mediaSource: 'screen' } as MediaTrackConstraints,
              audio: false
            });
            
            const video = document.createElement('video');
            video.srcObject = stream;
            video.play();
            
            video.addEventListener('loadedmetadata', () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(video, 0, 0);
                stream.getTracks().forEach(track => track.stop());
                
                canvas.toBlob(async (blob) => {
                  if (blob && navigator.clipboard && navigator.clipboard.write) {
                    try {
                      if (typeof ClipboardItem !== 'undefined') {
                        const item = new ClipboardItem({ 'image/png': blob });
                        await navigator.clipboard.write([item]);
                        alert('Screenshot captured and copied to clipboard! You can now paste it anywhere.');
                      } else {
                        throw new Error('ClipboardItem not supported');
                      }
                    } catch (err) {
                      const link = document.createElement('a');
                      link.download = `neural-flux-score-${Date.now()}.png`;
                      link.href = URL.createObjectURL(blob);
                      link.click();
                    }
                  } else {
                    const link = document.createElement('a');
                    link.download = `neural-flux-score-${Date.now()}.png`;
                    link.href = canvas.toDataURL();
                    link.click();
                  }
                });
              }
            });
            
            return;
          } catch (err) {
            console.error('Screen capture error:', err);
            alert('Screen capture was cancelled or not available. Falling back to automatic screenshot.');
          }
        } else {
          alert('Screen capture API is not available in your browser. Falling back to automatic screenshot.');
        }
      }
      
      const html2canvas = (await import('html2canvas')).default;
      if (!scoreRef.current) return;
      
      const canvas = await html2canvas(scoreRef.current, {
        backgroundColor: '#0a0a0a',
        scale: 2,
      });
      
      const link = document.createElement('a');
      link.download = `neural-flux-score-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error taking screenshot:', error);
    }
  };

  const shareToSocial = (platform: string) => {
    const scoreText = `I scored ${gameState?.score.toLocaleString()} points in Neural Flux! 🚀`;
    const url = window.location.href;
    
    const shareUrls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(scoreText)}&url=${encodeURIComponent(url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      reddit: `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(scoreText)}`,
      gmail: `mailto:?subject=${encodeURIComponent('My Neural Flux Score!')}&body=${encodeURIComponent(`${scoreText}\n\n${url}`)}`,
      instagram: 'https://www.instagram.com/', // Instagram doesn't support direct sharing
      snapchat: 'https://www.snapchat.com/', // Snapchat doesn't support direct sharing
    };
    
    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }
  };

  useEffect(() => {
    try {
      const manager = new GameStateManager((state) => {
        setGameState(state);
      });
      gameManagerRef.current = manager;
      
      const initialState = manager.getState();
      setGameState(initialState);
      
      manager.startGame();

      return () => {
        manager.stopGame();
      };
    } catch (error) {
      console.error('Error initializing game:', error);
      setGameState({
        activeRequests: [],
        score: 0,
        gameTimer: 0,
        difficultyLevel: 1,
        lives: 5,
        isGameOver: false,
        isShowingAnalysis: false,
        questionsShown: 0,
      });
    }
  }, []);

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden">
        <div className="text-white text-2xl font-['Orbitron'] animate-pulse">LOADING GAME...</div>
      </div>
    );
  }


  if (gameState.isGameOver) {
    const requestsPerSecond = gameState.difficultyLevel * 0.1;
    
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden" style={{ zIndex: 1 }}>
        {/* Circuit Board Background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
          <svg className="w-full h-full" style={{ filter: 'blur(0.5px)' }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const x1 = Math.random() * 100;
              const y1 = Math.random() * 100;
              const x2 = x1 + (Math.random() - 0.5) * 20;
              const y2 = y1 + (Math.random() - 0.5) * 20;
              return (
                <line
                  key={`line-${i}`}
                  x1={`${x1}%`}
                  y1={`${y1}%`}
                  x2={`${x2}%`}
                  y2={`${y2}%`}
                  className="circuit-line"
                  strokeWidth="0.5"
                />
              );
            })}
            {Array.from({ length: 80 }).map((_, i) => (
              <circle
                key={`node-${i}`}
                cx={`${Math.random() * 100}%`}
                cy={`${Math.random() * 100}%`}
                r="2"
                className={`circuit-node ${Math.random() > 0.5 ? 'blue' : ''}`}
                style={{ animationDelay: `${Math.random() * 2}s` }}
              />
            ))}
          </svg>
        </div>
        <div ref={gameOverRef} className="max-w-4xl w-full text-center text-white animate-fade-in relative z-10">
          <h1 className="text-6xl font-['Orbitron'] font-black mb-8 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent animate-pulse tracking-tight glitch"
              data-text="GAME OVER">
            GAME OVER
          </h1>
          
          <div className="bg-black/80 backdrop-blur-sm rounded-lg p-8 border border-gray-800/50 shadow-2xl mb-8"
               style={{ boxShadow: '0 0 40px rgba(239, 68, 68, 0.3), inset 0 0 40px rgba(239, 68, 68, 0.1)' }}>
            <p className="text-4xl mb-4 font-['Orbitron'] font-black text-green-400 tracking-tight">
              FINAL SCORE: {gameState.score.toLocaleString()}
            </p>
            <p className="text-xl mb-2 text-gray-400 font-['Rajdhani'] font-light">
              You survived for <span className="text-white font-bold">{gameState.gameTimer.toFixed(1)}s</span>
            </p>
            <p className="text-lg mb-6 text-gray-500 font-['Rajdhani'] font-light">
              Difficulty reached: <span className="text-purple-400 font-bold">Level {gameState.difficultyLevel}</span>
            </p>
          </div>

          {/* Game statistics */}
          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-blue-500/30 shadow-2xl"
               style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.1)' }}>
            <h2 className="text-3xl font-['Orbitron'] font-black mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
              GAME STATISTICS
            </h2>
            
            <div className="text-left space-y-6 text-lg font-['Rajdhani']">
              <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
                <h3 className="text-2xl font-['Orbitron'] font-bold text-yellow-400 mb-3 tracking-wide">⚡ PERFORMANCE</h3>
                <p className="text-gray-300 leading-relaxed font-light">
                  You handled <span className="text-yellow-400 font-bold">multiple requests</span> under time pressure. 
                  At your peak difficulty, you experienced approximately <span className="text-cyan-400 font-bold">{requestsPerSecond.toFixed(2)} requests/second</span>.
                </p>
              </div>

              <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
                <h3 className="text-2xl font-['Orbitron'] font-bold text-green-400 mb-3 tracking-wide">💡 WELL DONE</h3>
                <p className="text-gray-300 leading-relaxed font-light">
                  <span className="text-green-400 font-bold">Great job managing the pressure!</span> You demonstrated:
                  <ul className="list-disc list-inside mt-3 space-y-2 text-gray-400 font-light">
                    <li>Quick thinking under time constraints</li>
                    <li>Ability to handle increasing difficulty</li>
                    <li>Focus and concentration</li>
                    <li>Resilience in challenging situations</li>
                  </ul>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-black/60 backdrop-blur-sm rounded-lg p-8 border border-purple-500/30 shadow-2xl mt-8"
               style={{ boxShadow: '0 0 40px rgba(168, 85, 247, 0.3), inset 0 0 40px rgba(168, 85, 247, 0.1)' }}>
            <h2 className="text-3xl font-['Orbitron'] font-black mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent tracking-tight text-center">
              THE AI DILEMMA: WISDOM IN THE AGE OF AUTOMATION
            </h2>
            
            <div className="text-left space-y-6 text-lg font-['Rajdhani']">
              <div className="bg-black/60 rounded-lg p-6 border border-red-500/30">
                <h3 className="text-2xl font-['Orbitron'] font-bold text-red-400 mb-3 tracking-wide">⚠️ THE DANGERS OF OVER-RELIANCE</h3>
                <p className="text-gray-300 leading-relaxed font-light mb-3">
                  <span className="text-red-400 font-bold">Heavy AI dependence erodes human capability.</span> When we outsource thinking to machines, we risk:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-gray-400 font-light">
                  <li><span className="text-red-300">Cognitive atrophy</span> - Our critical thinking muscles weaken when unused</li>
                  <li><span className="text-red-300">Loss of creativity</span> - Original thought becomes a forgotten skill</li>
                  <li><span className="text-red-300">Dependency trap</span> - We become helpless without our digital crutch</li>
                  <li><span className="text-red-300">Identity erosion</span> - Our unique voice gets lost in algorithmic uniformity</li>
                  <li><span className="text-red-300">Privacy surrender</span> - Every query feeds the surveillance machine</li>
                </ul>
              </div>

              <div className="bg-black/60 rounded-lg p-6 border border-green-500/30">
                <h3 className="text-2xl font-['Orbitron'] font-bold text-green-400 mb-3 tracking-wide">✨ THE POWER OF STRATEGIC USE</h3>
                <p className="text-gray-300 leading-relaxed font-light mb-3">
                  <span className="text-green-400 font-bold">AI is a tool, not a replacement.</span> When used wisely, it amplifies human potential:
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 text-gray-400 font-light">
                  <li><span className="text-green-300">Augment, don't replace</span> - Use AI to enhance your skills, not bypass learning</li>
                  <li><span className="text-green-300">Complex problem solving</span> - Leverage AI for tasks beyond human capacity</li>
                  <li><span className="text-green-300">Time optimization</span> - Free yourself from repetitive work to focus on what matters</li>
                  <li><span className="text-green-300">Knowledge democratization</span> - Access expertise that was once gatekept</li>
                  <li><span className="text-green-300">Creative collaboration</span> - Partner with AI to explore new creative frontiers</li>
                </ul>
              </div>

              <div className="bg-black/60 rounded-lg p-6 border border-cyan-500/30">
                <h3 className="text-2xl font-['Orbitron'] font-bold text-cyan-400 mb-3 tracking-wide text-center">🎯 THE BALANCE</h3>
                <p className="text-gray-300 leading-relaxed font-light text-center">
                  <span className="text-cyan-400 font-bold text-xl">Use AI when it serves you. Think for yourself when it matters.</span>
                </p>
                <p className="text-gray-400 leading-relaxed font-light mt-4 text-center italic">
                  The future belongs to those who master the art of human-AI collaboration—knowing when to think, when to ask, and when to create.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center mt-8">
            <button
              onClick={() => {
                setShowSharePanel(true);
              }}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
                       text-white font-['Orbitron'] font-bold py-4 px-8 rounded-lg transition-all duration-200 
                       transform hover:scale-105 active:scale-95 shadow-lg text-lg tracking-wide flex items-center gap-3"
              style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              SHARE YOUR SCORE
            </button>
            <button
              onClick={() => {
                gameManagerRef.current?.startGame();
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 
                       text-white font-['Orbitron'] font-bold py-4 px-8 rounded-lg transition-all duration-200 
                       transform hover:scale-105 active:scale-95 shadow-lg text-lg tracking-wide"
              style={{ boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)' }}
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
        
        {/* Share Panel - also render in game over screen */}
        {showSharePanel && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
            <div className="bg-black/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl"
                 style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)' }}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-['Orbitron'] font-black text-cyan-400 mb-2">SHARE YOUR SCORE</h2>
                  <div className="flex items-center gap-4">
                    <div className="text-5xl font-['Orbitron'] font-black bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                         style={{ 
                           textShadow: '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
                           filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))'
                         }}>
                      {gameState?.score.toLocaleString()}
                    </div>
                    <div className="text-xl font-['Orbitron'] text-gray-400 font-light">
                      POINTS
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSharePanel(false);
                  }}
                  className="w-10 h-10 flex items-center justify-center text-white text-2xl font-bold rounded-full bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/30 hover:border-red-500 transition-all"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-['Orbitron'] font-bold text-cyan-400 mb-4">TAKE SCREENSHOT:</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => takeScreenshot(true)}
                      className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-['Orbitron'] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>AUTO</span>
                    </button>
                    <button
                      onClick={() => takeScreenshot(false)}
                      className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-['Orbitron'] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>MANUAL</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-xl font-['Orbitron'] font-bold text-cyan-400 mb-4">SHARE TO:</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <button
                      onClick={() => shareToSocial('twitter')}
                      className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Twitter"
                    >
                      <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => shareToSocial('facebook')}
                      className="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Facebook"
                    >
                      <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => shareToSocial('reddit')}
                      className="p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Reddit"
                    >
                      <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => shareToSocial('gmail')}
                      className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Gmail"
                    >
                      <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => shareToSocial('instagram')}
                      className="p-4 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Instagram"
                    >
                      <svg className="w-8 h-8 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </button>
                    
                    <button
                      onClick={() => shareToSocial('snapchat')}
                      className="p-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                      title="Snapchat"
                    >
                      <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 relative overflow-hidden">
      {/* Circuit Board Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20">
        <svg className="w-full h-full" style={{ filter: 'blur(0.5px)' }}>
          {Array.from({ length: 30 }).map((_, i) => {
            const x1 = Math.random() * 100;
            const y1 = Math.random() * 100;
            const x2 = x1 + (Math.random() - 0.5) * 20;
            const y2 = y1 + (Math.random() - 0.5) * 20;
            return (
              <line
                key={`line-${i}`}
                x1={`${x1}%`}
                y1={`${y1}%`}
                x2={`${x2}%`}
                y2={`${y2}%`}
                className="circuit-line"
                strokeWidth="0.5"
              />
            );
          })}
          {Array.from({ length: 80 }).map((_, i) => (
            <circle
              key={`node-${i}`}
              cx={`${Math.random() * 100}%`}
              cy={`${Math.random() * 100}%`}
              r="2"
              className={`circuit-node ${Math.random() > 0.5 ? 'blue' : ''}`}
              style={{ animationDelay: `${Math.random() * 2}s` }}
            />
          ))}
        </svg>
      </div>

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={async () => {
              await soundManager.resumeAudioContext();
              soundManager.playBack();
              onBackToHome?.();
            }}
            className="text-4xl font-['Orbitron'] font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent tracking-tight hover:from-cyan-400 hover:to-blue-400 transition-all cursor-pointer"
          >
            NEURAL FLUX
          </button>
          <div className="flex gap-4 text-sm font-['Rajdhani'] items-center">
            {combo > 0 && showCombo && (
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm px-4 py-2 rounded border-2 border-yellow-500/50 shadow-lg animate-pulse">
                <span className="text-yellow-400 font-bold text-lg">🔥 COMBO x{combo}</span>
              </div>
            )}
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded border border-gray-800/50 shadow-lg">
              <span className="text-gray-400 font-light">SCORE: </span>
              <span className="font-bold text-green-400 text-lg">{gameState.score.toLocaleString()}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded border border-gray-800/50">
              <span className="text-gray-400 font-light">TIME: </span>
              <span className="font-bold text-cyan-400 text-lg">{gameState.gameTimer.toFixed(1)}s</span>
            </div>
            <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded border border-gray-800/50">
              <span className="text-gray-400 font-light">LEVEL: </span>
              <span className="font-bold text-purple-400 text-lg">{gameState.difficultyLevel}</span>
            </div>
            <button
              onClick={() => {
                if (isPaused) {
                  setIsPaused(false);
                  setShowPauseMenu(false);
                  gameManagerRef.current?.resumeGame();
                } else {
                  setIsPaused(true);
                  setShowPauseMenu(true);
                  gameManagerRef.current?.pauseGame();
                }
              }}
              className="px-4 py-2 bg-black/60 border border-gray-700 text-white font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 transition-colors"
              title="Pause (ESC)"
            >
              {isPaused ? '▶' : '⏸'}
            </button>
          </div>
        </div>
      </div>

      {/* Pixelated Lives in Bottom Right Corner */}
      <div className="fixed bottom-6 right-6 z-30 pointer-events-none">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`pixelated-heart ${i < gameState.lives ? 'active' : ''} ${gameState.lives <= 2 ? 'warning' : ''}`}
              style={{
                imageRendering: 'pixelated',
                filter: i < gameState.lives ? 'drop-shadow(0 0 8px #ef4444) drop-shadow(0 0 15px #ef4444)' : 'none',
                animation: i < gameState.lives ? 'heart-beep 1s ease-in-out infinite' : 'none',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {i < gameState.lives ? '❤️' : '🤍'}
            </div>
          ))}
        </div>
        <style>{`
          .pixelated-heart {
            font-size: 24px;
            transition: all 0.3s;
            image-rendering: pixelated;
            image-rendering: -moz-crisp-edges;
            image-rendering: crisp-edges;
          }
          .pixelated-heart.active {
            filter: drop-shadow(0 0 8px #ef4444) drop-shadow(0 0 15px #ef4444) drop-shadow(0 0 20px #ef4444);
          }
          .pixelated-heart.warning {
            animation: heart-beep-fast 0.5s ease-in-out infinite !important;
          }
          @keyframes heart-beep {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.9; }
          }
          @keyframes heart-beep-fast {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.25); opacity: 0.8; }
          }
        `}</style>
      </div>

      {/* Analysis Screen */}
      {gameState.isShowingAnalysis && gameState.currentAnalysis && (
        <AnalysisScreen
          analysis={gameState.currentAnalysis}
          onContinue={() => gameManagerRef.current?.showNextCard()}
          onClose={onBackToHome}
        />
      )}

      {/* Loading state while analyzing */}
      {gameState.isShowingAnalysis && !gameState.currentAnalysis && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-4xl font-['Orbitron'] font-black mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              ANALYZING WITH AI...
            </div>
            <div className="flex justify-center gap-2">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Single Request Card */}
      {!gameState.isShowingAnalysis && (
        <div className="relative z-10">
          {gameState.activeRequests.length === 0 ? (
            <div className="text-center text-gray-500 py-20">
              <p className="text-xl font-['Rajdhani'] animate-pulse">
                {gameState.questionsShown === 0 ? 'LOADING QUESTION...' : 'LOADING NEXT QUESTION...'}
              </p>
            </div>
          ) : (
            gameState.activeRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onSubmit={async (answer) => {
                  await gameManagerRef.current?.submitAnswer(request.id, answer);
                }}
                onSkip={async () => {
                  await soundManager.resumeAudioContext();
                  gameManagerRef.current?.skipRequest(request.id);
                }}
              />
            ))
          )}
        </div>
      )}

      {/* Achievement Notification */}
      {showAchievementNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-[200] animate-fade-in">
          <div className="bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-sm border-2 border-yellow-400 rounded-lg px-8 py-4 shadow-2xl">
            <div className="flex items-center gap-4">
              <span className="text-4xl">{showAchievementNotification.icon}</span>
              <div>
                <div className="text-yellow-200 font-['Orbitron'] font-bold text-xl">ACHIEVEMENT UNLOCKED!</div>
                <div className="text-white font-['Rajdhani'] font-semibold">{showAchievementNotification.name}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warning when low on lives */}
      {showWarning && gameState.lives <= 2 && !gameState.isShowingAnalysis && (
        <div className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-1000 ease-out ${warningFading ? 'opacity-0' : 'opacity-100'}`}>
          <div className="bg-black/90 backdrop-blur-sm border border-red-500/50 rounded-lg px-8 py-4 shadow-2xl animate-pulse-fast"
               style={{ boxShadow: '0 0 30px rgba(239, 68, 68, 0.5)' }}>
            <p className="text-red-400 font-['Orbitron'] font-bold text-xl text-center tracking-wide">
              ⚠️ WARNING: {gameState.lives} {gameState.lives === 1 ? 'LIFE' : 'LIVES'} REMAINING!
            </p>
          </div>
        </div>
      )}

      {/* Pause Menu */}
      {showPauseMenu && isPaused && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[150]">
          <div className="bg-black/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
            <h2 className="text-3xl font-['Orbitron'] font-black text-cyan-400 mb-6 text-center">PAUSED</h2>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setIsPaused(false);
                  setShowPauseMenu(false);
                  gameManagerRef.current?.resumeGame();
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-['Orbitron'] font-bold rounded-lg transition-all"
              >
                RESUME (ESC)
              </button>
              <button
                onClick={() => {
                  setIsPaused(false);
                  setShowPauseMenu(false);
                  onBackToHome?.();
                }}
                className="w-full px-6 py-4 bg-black/60 border border-gray-700 text-white font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 transition-colors"
              >
                QUIT TO MENU
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Overlay */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[150]">
          <div className="bg-black/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-['Orbitron'] font-black text-cyan-400">KEYBOARD SHORTCUTS</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="w-10 h-10 flex items-center justify-center text-white text-2xl font-bold rounded-full bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/30 transition-all"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 text-white font-['Rajdhani']">
              <div className="bg-black/60 rounded-lg p-4 border border-gray-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-['Orbitron'] font-bold">ESC</span>
                  <span>Pause/Resume Game</span>
                </div>
              </div>
              <div className="bg-black/60 rounded-lg p-4 border border-gray-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-['Orbitron'] font-bold">CTRL/CMD + H</span>
                  <span>Show/Hide Help</span>
                </div>
              </div>
              <div className="bg-black/60 rounded-lg p-4 border border-gray-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-cyan-400 font-['Orbitron'] font-bold">ENTER</span>
                  <span>Submit Answer</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Panel */}
      {showSharePanel && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-[100] animate-fade-in">
          <div className="bg-black/95 backdrop-blur-sm border-2 border-cyan-500/50 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl"
               style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.5)' }}>
            <div className="flex justify-between items-center mb-6">
              <div className="flex-1">
                <h2 className="text-3xl font-['Orbitron'] font-black text-cyan-400 mb-2">SHARE YOUR SCORE</h2>
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-['Orbitron'] font-black bg-gradient-to-r from-green-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent"
                       style={{ 
                         textShadow: '0 0 20px rgba(34, 197, 94, 0.5), 0 0 40px rgba(59, 130, 246, 0.3)',
                         filter: 'drop-shadow(0 0 10px rgba(34, 197, 94, 0.6))'
                       }}>
                    {gameState?.score.toLocaleString()}
                  </div>
                  <div className="text-xl font-['Orbitron'] text-gray-400 font-light">
                    POINTS
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowSharePanel(false);
                }}
                className="w-10 h-10 flex items-center justify-center text-white text-2xl font-bold rounded-full bg-red-500/10 border-2 border-red-500/30 hover:bg-red-500/30 hover:border-red-500 transition-all"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-['Orbitron'] font-bold text-cyan-400 mb-4">TAKE SCREENSHOT:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => takeScreenshot(true)}
                    className="px-6 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-['Orbitron'] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>AUTO</span>
                  </button>
                  <button
                    onClick={() => takeScreenshot(false)}
                    className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-['Orbitron'] font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <span>MANUAL</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-['Orbitron'] font-bold text-cyan-400 mb-4">SHARE TO:</h3>
                <div className="grid grid-cols-4 gap-4">
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                    title="Twitter"
                  >
                    <svg className="w-8 h-8 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="p-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-600/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                    title="Facebook"
                  >
                    <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('reddit')}
                    className="p-4 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                    title="Reddit"
                  >
                    <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('gmail')}
                    className="p-4 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                    title="Gmail"
                  >
                    <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('instagram')}
                    className="p-4 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                    title="Instagram"
                  >
                    <svg className="w-8 h-8 text-pink-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('snapchat')}
                    className="p-4 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 rounded-lg transition-all duration-200 flex items-center justify-center"
                    title="Snapchat"
                  >
                    <svg className="w-8 h-8 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
