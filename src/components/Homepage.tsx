import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useStatistics } from '../contexts/StatisticsContext';
import { soundManager } from '../utils/sounds';

interface HomepageProps {
  onStartGame: () => void;
}

type View = 'home' | 'leaderboard' | 'settings' | 'account' | 'statistics' | 'achievements';

export default function Homepage({ onStartGame }: HomepageProps) {
  const { settings } = useSettings();
  const [glitchActive, setGlitchActive] = useState(false);
  const [view, setView] = useState<View>('home');
  const [showGlitchTransition, setShowGlitchTransition] = useState(false);

  useEffect(() => {
    soundManager.setSoundEffectsEnabled(settings.soundEffects);
    soundManager.setBackgroundMusicEnabled(settings.backgroundMusic);
  }, [settings.soundEffects, settings.backgroundMusic]);

  useEffect(() => {
    // Random glitch effect - less frequent
    const interval = setInterval(() => {
      if (Math.random() > 0.85) {
        setGlitchActive(true);
        setTimeout(() => setGlitchActive(false), 300);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartGame = () => {
    setShowGlitchTransition(true);
    setTimeout(() => {
      onStartGame();
    }, 1500);
  };

  if (view === 'leaderboard') {
    return <LeaderboardView onBack={() => setView('home')} />;
  }

  if (view === 'settings') {
    return <SettingsView onBack={() => setView('home')} />;
  }

  if (view === 'account') {
    return <AccountView onBack={() => setView('home')} />;
  }

  if (view === 'statistics') {
    return <StatisticsView onBack={() => setView('home')} />;
  }

  if (view === 'achievements') {
    return <AchievementsView onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
      {/* Binary Rain Background */}
      <BinaryRain />
      
      {/* Circuit Board Background */}
      <CircuitBoardBackground />

      {/* Glitch Transition Overlay */}
      {showGlitchTransition && <GlitchTransition />}

      {/* Top Navigation */}
      <nav className="absolute top-6 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-8">
        <button
          onClick={async () => {
            await soundManager.resumeAudioContext();
            soundManager.playNavigation();
            setView('home');
          }}
          className="text-white font-['Orbitron'] text-sm font-semibold hover:text-cyan-400 transition-colors flex items-center gap-2"
          style={{ paddingTop: '2px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          HOME
        </button>
        <button
          onClick={async () => {
            const resumed = await soundManager.resumeAudioContext();
            if (resumed) {
              soundManager.playClick();
            }
            setView('leaderboard');
          }}
          className="text-white font-['Orbitron'] text-sm font-semibold hover:text-cyan-400 transition-colors flex items-center gap-2"
          style={{ paddingTop: '2px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
          LEADERBOARD
        </button>
        <button
          onClick={async () => {
            const resumed = await soundManager.resumeAudioContext();
            if (resumed) {
              soundManager.playNavigation();
            }
            setView('account');
          }}
          className="text-white font-['Orbitron'] text-sm font-semibold hover:text-cyan-400 transition-colors flex items-center gap-2"
          style={{ paddingTop: '2px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          ACCOUNT
        </button>
        <button
          onClick={async () => {
            const resumed = await soundManager.resumeAudioContext();
            if (resumed) {
              soundManager.playNavigation();
            }
            setView('settings');
          }}
          className="text-white font-['Orbitron'] text-sm font-semibold hover:text-cyan-400 transition-colors flex items-center gap-2"
          style={{ paddingTop: '2px' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          SETTINGS
        </button>
      </nav>

      {/* Main Content - Centered */}
      <div className="w-full max-w-6xl mx-auto px-4 relative z-10">
        {/* Central Panel - Vertical Layout */}
        <div className="relative bg-black/70 backdrop-blur-md border-2 border-cyan-500/30 rounded-2xl p-10 md:p-16 shadow-2xl"
             style={{
               boxShadow: '0 0 60px rgba(59, 130, 246, 0.4), inset 0 0 60px rgba(59, 130, 246, 0.1), 0 0 120px rgba(59, 130, 246, 0.2)',
             }}>
          {/* Title Section */}
          <div className="text-center mb-12">
            <h1 
              className={`text-6xl md:text-8xl font-['Orbitron'] font-black mb-4 tracking-tight ${glitchActive ? 'rainbow-glitch-active' : ''}`}
            >
              <span 
                className="inline-block"
                data-text="NEURAL"
                style={{
                  background: 'linear-gradient(90deg, #ff7f00 0%, #ff4500 50%, #ff0000 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                NEURAL
              </span>
              {' '}
              <span 
                className="inline-block"
                data-text="FLUX"
                style={{
                  background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #f97316 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                FLUX
              </span>
            </h1>
            <style>{`
              .rainbow-glitch-active {
                position: relative;
              }
              .rainbow-glitch-active span {
                position: relative;
                display: inline-block;
              }
              .rainbow-glitch-active span::before,
              .rainbow-glitch-active span::after {
                content: attr(data-text);
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                opacity: 0;
                pointer-events: none;
                white-space: nowrap;
              }
              .rainbow-glitch-active span::before {
                color: #ff0000;
                transform: translateX(-1.5px);
                text-shadow: 1px 0 0 #ff0000, -1px 0 0 #00ffff;
                animation: glitch-red 0.2s ease-in-out;
                clip-path: inset(20% 0 40% 0);
              }
              .rainbow-glitch-active span::after {
                color: #00ffff;
                transform: translateX(1.5px);
                text-shadow: -1px 0 0 #00ffff, 1px 0 0 #ff00ff;
                animation: glitch-cyan 0.2s ease-in-out;
                clip-path: inset(40% 0 20% 0);
              }
              @keyframes glitch-red {
                0%, 100% { opacity: 0; transform: translateX(-1.5px); }
                25%, 75% { opacity: 0.5; transform: translateX(-2px); }
                50% { opacity: 0.7; transform: translateX(-1px); }
              }
              @keyframes glitch-cyan {
                0%, 100% { opacity: 0; transform: translateX(1.5px); }
                25%, 75% { opacity: 0.5; transform: translateX(2px); }
                50% { opacity: 0.7; transform: translateX(1px); }
              }
            `}</style>
            <p className="text-2xl md:text-3xl font-['Rajdhani'] text-white/80 font-light tracking-wide mb-8">
              Navigate the AI Mindscape
            </p>
          </div>

          {/* Action Buttons - Below Caption */}
          <div className="flex flex-col items-center gap-4 max-w-md mx-auto">
            <button
              onClick={async () => {
                const resumed = await soundManager.resumeAudioContext();
                if (resumed) {
                  soundManager.playClick();
                }
                handleStartGame();
              }}
              className="w-full px-10 py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500 text-white font-['Orbitron'] font-bold text-lg rounded-xl hover:from-cyan-600 hover:via-blue-600 hover:to-cyan-600 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl tracking-wide text-center relative overflow-hidden group"
              style={{
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.6), 0 0 60px rgba(59, 130, 246, 0.3)',
              }}
            >
              <span className="relative z-10">Experience AI's Daily Life</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
            <button
              onClick={async () => {
                await soundManager.resumeAudioContext();
                soundManager.playButtonClick();
                setView('leaderboard');
              }}
              className="w-full px-10 py-5 bg-black/60 border-2 border-gray-600/50 text-white font-['Orbitron'] font-semibold text-lg rounded-xl hover:bg-black/80 hover:border-cyan-500/50 hover:text-cyan-400 transition-all duration-300 transform hover:scale-105 active:scale-95 tracking-wide text-center"
              style={{
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.5)',
              }}
            >
              LEADERBOARD
            </button>
          </div>
        </div>
      </div>

      {/* Floating Achievements Button - Left Side */}
      <button
        onClick={async () => {
          await soundManager.resumeAudioContext();
          soundManager.playButtonClick();
          setView('achievements');
        }}
        className="absolute left-8 top-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-orange-500 rounded-lg shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
        style={{
          animation: 'float-vertical 3s ease-in-out infinite',
          boxShadow: '0 0 30px rgba(249, 115, 22, 0.8), 0 0 60px rgba(249, 115, 22, 0.4)',
        }}
        title="Achievements"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>

      {/* Floating Statistics Button - Right Side */}
      <button
        onClick={async () => {
          await soundManager.resumeAudioContext();
          soundManager.playButtonClick();
          setView('statistics');
        }}
        className="absolute right-8 top-1/2 -translate-y-1/2 z-30 w-16 h-16 bg-blue-500 rounded-lg shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-300"
        style={{
          animation: 'float-vertical 3s ease-in-out infinite 1.5s',
          boxShadow: '0 0 30px rgba(59, 130, 246, 0.8), 0 0 60px rgba(59, 130, 246, 0.4)',
        }}
        title="Statistics"
      >
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </button>

      <style>{`
        @keyframes float-vertical {
          0%, 100% { transform: translateY(-50%) translateY(0px); }
          50% { transform: translateY(-50%) translateY(-15px); }
        }
      `}</style>

      {/* Bottom Right Logo */}
      <div className="absolute bottom-4 right-4 z-20 opacity-30">
        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
    </div>
  );
}

// Binary Rain Effect
function BinaryRain() {
  const [binaries, setBinaries] = useState<Array<{ id: number; x: number; speed: number; value: string; opacity: number }>>([]);

  useEffect(() => {
    const newBinaries: Array<{ id: number; x: number; speed: number; value: string; opacity: number }> = [];
    for (let i = 0; i < 100; i++) {
      newBinaries.push({
        id: i,
        x: Math.random() * 100,
        speed: 0.5 + Math.random() * 2,
        value: Math.random() > 0.5 ? '0' : '1',
        opacity: 0.1 + Math.random() * 0.3,
      });
    }
    setBinaries(newBinaries);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {binaries.map((binary) => (
        <div
          key={binary.id}
          className="absolute text-cyan-400/30 font-['Orbitron'] text-xl md:text-2xl font-bold"
          style={{
            left: `${binary.x}%`,
            top: '-50px',
            opacity: binary.opacity,
            animation: `fall ${10 / binary.speed}s linear infinite`,
            animationDelay: `${Math.random() * 2}s`,
            textShadow: '0 0 10px rgba(59, 130, 246, 0.5)',
          }}
        >
          {binary.value}
        </div>
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(calc(100vh + 50px));
          }
        }
      `}</style>
    </div>
  );
}

// Glitch Transition
function GlitchTransition() {
  return (
    <div className="fixed inset-0 z-50 bg-black pointer-events-none">
      <div className="absolute inset-0 glitch-overlay" style={{
        background: 'linear-gradient(90deg, transparent 50%, rgba(255,0,255,0.03) 50%, rgba(255,0,255,0.03) 52%, transparent 52%)',
        backgroundSize: '100% 3px',
        animation: 'glitch-scan 0.1s infinite',
      }}></div>
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
        animation: 'glitch-pulse 0.3s infinite',
      }}></div>
      <style>{`
        @keyframes glitch-scan {
          0% { transform: translateY(0); }
          100% { transform: translateY(10px); }
        }
        @keyframes glitch-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Leaderboard Component
function LeaderboardView({ onBack }: { onBack: () => void }) {
  const [leaderboard, setLeaderboard] = useState<Array<{
    id: number;
    name: string;
    score: number;
    rank: number;
    previousRank: number;
    previousScore: number;
    rankChange: 'up' | 'down' | null;
    scoreChange: 'up' | 'down' | null;
  }>>([
    { id: 1, name: 'Alex Chen', score: 45230, rank: 1, previousRank: 1, previousScore: 45230, rankChange: null, scoreChange: null },
    { id: 2, name: 'Maya Patel', score: 43890, rank: 2, previousRank: 2, previousScore: 43890, rankChange: null, scoreChange: null },
    { id: 3, name: 'Jordan Kim', score: 42560, rank: 3, previousRank: 3, previousScore: 42560, rankChange: null, scoreChange: null },
    { id: 4, name: 'Sam Rivera', score: 41200, rank: 4, previousRank: 4, previousScore: 41200, rankChange: null, scoreChange: null },
    { id: 5, name: 'Taylor Morgan', score: 39850, rank: 5, previousRank: 5, previousScore: 39850, rankChange: null, scoreChange: null },
    { id: 6, name: 'Casey Lee', score: 38420, rank: 6, previousRank: 6, previousScore: 38420, rankChange: null, scoreChange: null },
    { id: 7, name: 'Riley Zhang', score: 37100, rank: 7, previousRank: 7, previousScore: 37100, rankChange: null, scoreChange: null },
    { id: 8, name: 'Quinn Anderson', score: 35890, rank: 8, previousRank: 8, previousScore: 35890, rankChange: null, scoreChange: null },
    { id: 9, name: 'Avery Johnson', score: 34560, rank: 9, previousRank: 9, previousScore: 34560, rankChange: null, scoreChange: null },
    { id: 10, name: 'Blake Martinez', score: 33210, rank: 10, previousRank: 10, previousScore: 33210, rankChange: null, scoreChange: null },
  ]);

  useEffect(() => {
    const updateLeaderboard = () => {
      setLeaderboard(prev => {
        const newBoard: Array<{
          id: number;
          name: string;
          score: number;
          rank: number;
          previousRank: number;
          previousScore: number;
          rankChange: 'up' | 'down' | null;
          scoreChange: 'up' | 'down' | null;
        }> = prev.map(p => ({ 
          ...p, 
          previousRank: p.rank, 
          previousScore: p.score,
          rankChange: null as 'up' | 'down' | null,
          scoreChange: null as 'up' | 'down' | null
        }));
        
        // Randomly change scores for all players
        newBoard.forEach(player => {
          const scoreChange = Math.random() > 0.3; // 70% chance to change score
          if (scoreChange) {
            const changeAmount = Math.floor(Math.random() * 800) + 50; // 50-850 points
            const isIncrease = Math.random() > 0.4; // 60% chance to increase
            
            if (isIncrease) {
              player.score += changeAmount;
              player.scoreChange = 'up';
            } else {
              player.score = Math.max(player.score - changeAmount, 30000); // Don't go below 30k
              player.scoreChange = 'down';
            }
          }
        });
        
        // Randomly swap positions based on new scores
        const changeCount = Math.floor(Math.random() * 3) + 1; // 1-3 changes
        
        for (let i = 0; i < changeCount; i++) {
          const playerIndex = Math.floor(Math.random() * (newBoard.length - 1));
          const direction = Math.random() > 0.5 ? 1 : -1;
          const targetIndex = playerIndex + direction;
          
          if (targetIndex >= 0 && targetIndex < newBoard.length) {
            // Only swap if it makes sense score-wise
            if ((direction === -1 && newBoard[playerIndex].score > newBoard[targetIndex].score) ||
                (direction === 1 && newBoard[playerIndex].score < newBoard[targetIndex].score)) {
              const temp = newBoard[playerIndex];
              newBoard[playerIndex] = newBoard[targetIndex];
              newBoard[targetIndex] = temp;
            }
          }
        }
        
        // Sort by score descending
        newBoard.sort((a, b) => b.score - a.score);
        
        // Update ranks and detect changes
        newBoard.forEach((p, idx) => {
          const newRank = idx + 1;
          if (p.previousRank !== newRank) {
            p.rankChange = newRank < p.previousRank ? 'up' : 'down';
          } else {
            p.rankChange = null;
          }
          p.rank = newRank;
          
          // Clear score change after a moment if no actual change
          if (p.previousScore === p.score) {
            p.scoreChange = null;
          }
        });
        
        return newBoard;
      });
    };

    // Random interval between 1.5 and 4 seconds
    const scheduleUpdate = () => {
      const delay = Math.random() * 2500 + 1500; // 1500-4000ms
      setTimeout(() => {
        updateLeaderboard();
        scheduleUpdate();
      }, delay);
    };

    scheduleUpdate();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4">
      <BinaryRain />
      <CircuitBoardBackground />
      
      <div className="w-full max-w-4xl relative z-10">
        <div className="bg-black/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-8 shadow-2xl"
             style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-['Orbitron'] font-black text-cyan-400 tracking-tight">LEADERBOARD</h2>
            <button
              onClick={async () => {
                await soundManager.resumeAudioContext();
                soundManager.playBack();
                onBack();
              }}
              className="px-6 py-2 bg-black/60 border border-gray-700 text-white font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 transition-colors"
            >
              BACK
            </button>
          </div>
          
          <div className="space-y-2 relative">
            {leaderboard.map((player) => {
              const rankColor = player.rankChange === 'up' 
                ? 'text-green-400' 
                : player.rankChange === 'down' 
                ? 'text-red-400' 
                : 'text-cyan-400';
              
              const borderColor = player.rankChange === 'up'
                ? 'border-green-500/50'
                : player.rankChange === 'down'
                ? 'border-red-500/50'
                : 'border-gray-800/50';

              const bgGlow = player.rankChange === 'up'
                ? 'bg-green-500/10'
                : player.rankChange === 'down'
                ? 'bg-red-500/10'
                : '';

              return (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 bg-black/60 border rounded-lg transition-all duration-700 ease-in-out hover:border-cyan-500/50 ${borderColor} ${bgGlow}`}
                  style={{
                    order: player.rank,
                    transform: player.rankChange ? 'scale(1.02)' : 'scale(1)',
                    animation: player.rankChange === 'up' 
                      ? 'slideUp 0.7s ease-out' 
                      : player.rankChange === 'down' 
                      ? 'slideDown 0.7s ease-out' 
                      : 'none',
                  }}
                >
                  <div className="flex items-center gap-4">
                    <span 
                      className={`text-2xl font-['Orbitron'] font-bold w-12 text-center transition-colors duration-500 ${rankColor}`}
                      style={{
                        textShadow: player.rankChange === 'up' 
                          ? '0 0 10px rgba(34, 197, 94, 0.8)' 
                          : player.rankChange === 'down' 
                          ? '0 0 10px rgba(239, 68, 68, 0.8)' 
                          : 'none',
                      }}
                    >
                      #{player.rank}
                    </span>
                  <span className="text-xl font-['Rajdhani'] font-semibold text-white">
                    {player.name}
                  </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {player.scoreChange === 'up' && (
                      <div className="relative w-12 h-8 flex items-end justify-center">
                        <svg 
                          className="absolute inset-0 w-full h-full" 
                          viewBox="0 0 48 32" 
                          preserveAspectRatio="none"
                          style={{ filter: 'drop-shadow(0 0 6px rgba(34, 197, 94, 0.9))' }}
                        >
                          <path
                            d="M 4 24 L 12 20 L 20 16 L 28 12 L 36 8 L 44 4"
                            stroke="#22c55e"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-pulse"
                          />
                          <path
                            d="M 4 24 L 12 20 L 20 16 L 28 12 L 36 8 L 44 4 L 44 32 L 4 32 Z"
                            fill={`url(#greenGradient-${player.id})`}
                            opacity="0.3"
                          />
                          <defs>
                            <linearGradient id={`greenGradient-${player.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    )}
                    {player.scoreChange === 'down' && (
                      <div className="relative w-12 h-8 flex items-end justify-center">
                        <svg 
                          className="absolute inset-0 w-full h-full" 
                          viewBox="0 0 48 32" 
                          preserveAspectRatio="none"
                          style={{ filter: 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.9))' }}
                        >
                          <path
                            d="M 4 8 L 12 12 L 20 16 L 28 20 L 36 24 L 44 28"
                            stroke="#ef4444"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="animate-pulse"
                          />
                          <path
                            d="M 4 8 L 12 12 L 20 16 L 28 20 L 36 24 L 44 28 L 44 32 L 4 32 Z"
                            fill={`url(#redGradient-${player.id})`}
                            opacity="0.3"
                          />
                          <defs>
                            <linearGradient id={`redGradient-${player.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    )}
                    <span 
                      className={`text-xl font-['Orbitron'] font-bold transition-colors duration-500 ${
                        player.scoreChange === 'up' 
                          ? 'text-green-400' 
                          : player.scoreChange === 'down' 
                          ? 'text-red-400' 
                          : 'text-green-400'
                      }`}
                      style={{
                        textShadow: player.scoreChange === 'up' 
                          ? '0 0 8px rgba(34, 197, 94, 0.6)' 
                          : player.scoreChange === 'down' 
                          ? '0 0 8px rgba(239, 68, 68, 0.6)' 
                          : 'none',
                      }}
                    >
                      {player.score.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
            <style>{`
              @keyframes slideUp {
                0% {
                  transform: translateY(10px) scale(1);
                  opacity: 0.8;
                }
                50% {
                  transform: translateY(-5px) scale(1.02);
                }
                100% {
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
              }
              @keyframes slideDown {
                0% {
                  transform: translateY(-10px) scale(1);
                  opacity: 0.8;
                }
                50% {
                  transform: translateY(5px) scale(1.02);
                }
                100% {
                  transform: translateY(0) scale(1);
                  opacity: 1;
                }
              }
            `}</style>
          </div>
        </div>
      </div>
    </div>
  );
}

// Settings Component
function SettingsView({ onBack }: { onBack: () => void }) {
  const { settings, updateSettings, updateAccount } = useSettings();

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4">
      <BinaryRain />
      <CircuitBoardBackground />
      
      <div className="w-full max-w-3xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="bg-black/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-8 shadow-2xl"
             style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-['Orbitron'] font-black text-cyan-400 tracking-tight">SETTINGS</h2>
            <button
              onClick={async () => {
                await soundManager.resumeAudioContext();
                soundManager.playBack();
                onBack();
              }}
              className="px-6 py-2 bg-black/60 border border-gray-700 text-white font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 transition-colors"
            >
              BACK
            </button>
          </div>
          
          <div className="space-y-8 text-white font-['Rajdhani']">
            <div>
              <h3 className="text-xl font-['Orbitron'] font-bold text-cyan-400 mb-4">AUDIO</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 cursor-pointer" 
                    checked={settings.soundEffects}
                    onChange={async (e) => {
                      updateSettings({ soundEffects: e.target.checked });
                      soundManager.setSoundEffectsEnabled(e.target.checked);
                      if (e.target.checked) {
                        await soundManager.resumeAudioContext();
                        soundManager.playClick();
                      }
                    }}
                  />
                  <span>Sound Effects</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 cursor-pointer" 
                    checked={settings.backgroundMusic}
                    onChange={async (e) => {
                      updateSettings({ backgroundMusic: e.target.checked });
                      soundManager.setBackgroundMusicEnabled(e.target.checked);
                      if (settings.soundEffects) {
                        await soundManager.resumeAudioContext();
                        soundManager.playClick();
                      }
                    }}
                  />
                  <span>Background Music</span>
                </label>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Sound Effects Volume: {settings.soundVolume}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.soundVolume}
                    onChange={(e) => {
                      updateSettings({ soundVolume: parseInt(e.target.value) });
                      soundManager.setSoundVolume(parseInt(e.target.value));
                    }}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Music Volume: {settings.musicVolume}%</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.musicVolume}
                    onChange={(e) => {
                      updateSettings({ musicVolume: parseInt(e.target.value) });
                      soundManager.setMusicVolume(parseInt(e.target.value));
                    }}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-['Orbitron'] font-bold text-cyan-400 mb-4">DISPLAY</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 cursor-pointer" 
                    checked={settings.glitchEffects}
                    onChange={async (e) => {
                      updateSettings({ glitchEffects: e.target.checked });
                      if (settings.soundEffects) {
                        await soundManager.resumeAudioContext();
                        soundManager.playClick();
                      }
                    }}
                  />
                  <span>Glitch Effects</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 cursor-pointer" 
                    checked={settings.circuitBoardBackground}
                    onChange={async (e) => {
                      updateSettings({ circuitBoardBackground: e.target.checked });
                      if (settings.soundEffects) {
                        await soundManager.resumeAudioContext();
                        soundManager.playClick();
                      }
                    }}
                  />
                  <span>Circuit Board Background</span>
                </label>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-['Orbitron'] font-bold text-cyan-400 mb-4">ACCOUNT</h3>
              <div className="space-y-3 bg-black/40 rounded-lg p-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input
                    type="text"
                    value={settings.account.name}
                    onChange={(e) => updateAccount({ name: e.target.value })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.account.email}
                    onChange={(e) => updateAccount({ email: e.target.value })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={settings.account.phone}
                    onChange={(e) => updateAccount({ phone: e.target.value })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter your phone"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={settings.account.location}
                    onChange={(e) => updateAccount({ location: e.target.value })}
                    className="w-full bg-black/60 border border-gray-700 rounded px-3 py-2 text-white focus:border-cyan-500 focus:outline-none"
                    placeholder="Enter your location"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Account Component
function AccountView({ onBack }: { onBack: () => void }) {
  const { settings, updateAccount } = useSettings();

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4">
      <BinaryRain />
      <CircuitBoardBackground />
      
      <div className="w-full max-w-3xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="bg-black/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-8 shadow-2xl"
             style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-['Orbitron'] font-black text-cyan-400 tracking-tight">ACCOUNT</h2>
            <button
              onClick={async () => {
                await soundManager.resumeAudioContext();
                soundManager.playBack();
                onBack();
              }}
              className="px-6 py-2 bg-black/60 border border-gray-700 text-white font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 transition-colors"
            >
              BACK
            </button>
          </div>
          
          <div className="space-y-6 text-white font-['Rajdhani']">
            <div className="flex items-center gap-6 mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-4xl font-bold">
                {settings.account.name ? settings.account.name.charAt(0).toUpperCase() : '?'}
              </div>
              <div>
                <h3 className="text-2xl font-['Orbitron'] font-bold text-white">
                  {settings.account.name || 'Anonymous User'}
                </h3>
                <p className="text-gray-400">{settings.account.email || 'No email set'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">Profile Picture URL</label>
                <input
                  type="url"
                  value={settings.account.pfp}
                  onChange={(e) => updateAccount({ pfp: e.target.value })}
                  className="w-full bg-black/60 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="https://example.com/pfp.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">Name</label>
                <input
                  type="text"
                  value={settings.account.name}
                  onChange={(e) => updateAccount({ name: e.target.value })}
                  className="w-full bg-black/60 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">Email Address</label>
                <input
                  type="email"
                  value={settings.account.email}
                  onChange={(e) => updateAccount({ email: e.target.value })}
                  className="w-full bg-black/60 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="your.email@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={settings.account.phone}
                  onChange={(e) => updateAccount({ phone: e.target.value })}
                  className="w-full bg-black/60 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">Location</label>
                <input
                  type="text"
                  value={settings.account.location}
                  onChange={(e) => updateAccount({ location: e.target.value })}
                  className="w-full bg-black/60 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">Bio</label>
                <textarea
                  value={settings.account.bio}
                  onChange={(e) => updateAccount({ bio: e.target.value })}
                  className="w-full bg-black/60 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none h-24 resize-none"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-['Orbitron'] text-cyan-400 mb-2">Website</label>
                <input
                  type="url"
                  value={settings.account.website}
                  onChange={(e) => updateAccount({ website: e.target.value })}
                  className="w-full bg-black/60 border border-gray-700 rounded px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Statistics View
function StatisticsView({ onBack }: { onBack: () => void }) {
  const { stats } = useStatistics();

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4">
      <BinaryRain />
      <CircuitBoardBackground />
      
      <div className="w-full max-w-4xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="bg-black/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-8 shadow-2xl"
             style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-['Orbitron'] font-black text-cyan-400 tracking-tight">STATISTICS</h2>
            <button
              onClick={async () => {
                await soundManager.resumeAudioContext();
                soundManager.playBack();
                onBack();
              }}
              className="px-6 py-2 bg-black/60 border border-gray-700 text-white font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 transition-colors"
            >
              BACK
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6 text-white font-['Rajdhani']">
            <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
              <div className="text-3xl font-['Orbitron'] font-black text-cyan-400 mb-2">{stats.totalGames}</div>
              <div className="text-gray-400">Total Games</div>
            </div>
            <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
              <div className="text-3xl font-['Orbitron'] font-black text-green-400 mb-2">{stats.bestScore.toLocaleString()}</div>
              <div className="text-gray-400">Best Score</div>
            </div>
            <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
              <div className="text-3xl font-['Orbitron'] font-black text-yellow-400 mb-2">{stats.averageScore.toLocaleString()}</div>
              <div className="text-gray-400">Average Score</div>
            </div>
            <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
              <div className="text-3xl font-['Orbitron'] font-black text-purple-400 mb-2">{Math.floor(stats.totalTimePlayed / 60)}m</div>
              <div className="text-gray-400">Total Time Played</div>
            </div>
            <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
              <div className="text-3xl font-['Orbitron'] font-black text-orange-400 mb-2">{stats.bestDifficulty}</div>
              <div className="text-gray-400">Best Difficulty</div>
            </div>
            <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50">
              <div className="text-3xl font-['Orbitron'] font-black text-pink-400 mb-2">{stats.longestStreak}</div>
              <div className="text-gray-400">Longest Streak</div>
            </div>
            <div className="bg-black/60 rounded-lg p-6 border border-gray-800/50 col-span-2">
              <div className="text-2xl font-['Orbitron'] font-black text-cyan-400 mb-2">
                {stats.totalQuestionsAnswered > 0 
                  ? Math.round((stats.correctAnswers / stats.totalQuestionsAnswered) * 100) 
                  : 0}%
              </div>
              <div className="text-gray-400">Accuracy Rate</div>
              <div className="text-sm text-gray-500 mt-2">
                {stats.correctAnswers} correct out of {stats.totalQuestionsAnswered} questions
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Achievements View
function AchievementsView({ onBack }: { onBack: () => void }) {
  const { achievements } = useStatistics();

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center p-4">
      <BinaryRain />
      <CircuitBoardBackground />
      
      <div className="w-full max-w-4xl relative z-10 max-h-[90vh] overflow-y-auto">
        <div className="bg-black/80 backdrop-blur-sm border border-gray-800/50 rounded-lg p-8 shadow-2xl"
             style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3)' }}>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-['Orbitron'] font-black text-cyan-400 tracking-tight">
              ACHIEVEMENTS ({achievements.filter(a => a.unlocked).length}/{achievements.length})
            </h2>
            <button
              onClick={async () => {
                await soundManager.resumeAudioContext();
                soundManager.playBack();
                onBack();
              }}
              className="px-6 py-2 bg-black/60 border border-gray-700 text-white font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 transition-colors"
            >
              BACK
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`bg-black/60 rounded-lg p-6 border transition-all ${
                  achievement.unlocked
                    ? 'border-cyan-500/50 shadow-cyan-500/20 shadow-lg'
                    : 'border-gray-800/50 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className={`font-['Orbitron'] font-bold text-lg ${
                      achievement.unlocked ? 'text-cyan-400' : 'text-gray-500'
                    }`}>
                      {achievement.name}
                    </div>
                    <div className="text-gray-400 text-sm font-['Rajdhani'] mt-1">
                      {achievement.description}
                    </div>
                    {achievement.unlocked && (
                      <div className="text-green-400 text-xs font-['Orbitron'] mt-2">✓ UNLOCKED</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Circuit Board Background Component
function CircuitBoardBackground() {
  const [nodes, setNodes] = useState<Array<{ x: number; y: number; color: 'red' | 'blue'; delay: number }>>([]);

  useEffect(() => {
    const newNodes: Array<{ x: number; y: number; color: 'red' | 'blue'; delay: number }> = [];
    for (let i = 0; i < 150; i++) {
      newNodes.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: Math.random() > 0.5 ? 'red' : 'blue',
        delay: Math.random() * 2,
      });
    }
    setNodes(newNodes);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      <svg className="w-full h-full" style={{ filter: 'blur(0.5px)' }}>
        {Array.from({ length: 50 }).map((_, i) => {
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
        
        {nodes.map((node, i) => (
          <circle
            key={`node-${i}`}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r="3"
            className={`circuit-node ${node.color === 'blue' ? 'blue' : ''}`}
            style={{ animationDelay: `${node.delay}s` }}
          />
        ))}
      </svg>
    </div>
  );
}
