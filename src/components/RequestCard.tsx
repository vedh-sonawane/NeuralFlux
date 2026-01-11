import { useState, useEffect, useRef } from 'react';
import { Request } from '../types';
import { soundManager } from '../utils/sounds';

interface RequestCardProps {
  request: Request;
  onSubmit: (answer: string) => Promise<void>;
  onSkip?: () => void;
}

const TYPE_COLORS: Record<Request['type'], string> = {
  FACT: 'bg-blue-600',
  MATH: 'bg-purple-600',
  CREATIVE: 'bg-green-600',
  EMOTIONAL: 'bg-pink-600',
};

const TYPE_BORDERS: Record<Request['type'], string> = {
  FACT: 'border-blue-500',
  MATH: 'border-purple-500',
  CREATIVE: 'border-green-500',
  EMOTIONAL: 'border-pink-500',
};

const TYPE_GLOWS: Record<Request['type'], string> = {
  FACT: 'shadow-blue-500/50',
  MATH: 'shadow-purple-500/50',
  CREATIVE: 'shadow-green-500/50',
  EMOTIONAL: 'shadow-pink-500/50',
};

export default function RequestCard({ request, onSubmit, onSkip }: RequestCardProps) {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showWireExplosion, setShowWireExplosion] = useState(false);
  const [showUserHover, setShowUserHover] = useState(false);
  const [isUserPanelOpen, setIsUserPanelOpen] = useState(false);
  const [showSkipTooltip, setShowSkipTooltip] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const userPanelRef = useRef<HTMLDivElement>(null);
  
  const timePercentage = (request.timeRemaining / request.timeLimit) * 100;
  const isUrgent = timePercentage < 30;
  const isCritical = timePercentage < 10;
  const hasExpired = request.hasExpired || false;
  
  // Auto-focus on mount
  useEffect(() => {
    if (inputRef.current && !hasExpired) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [hasExpired]);

  // Typing indicator
  useEffect(() => {
    if (answer.length > 0 && !isTyping) {
      setIsTyping(true);
    } else if (answer.length === 0 && isTyping) {
      setIsTyping(false);
    }
  }, [answer, isTyping]);

  // Close user panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserPanelOpen && userPanelRef.current && !userPanelRef.current.contains(event.target as Node)) {
        setIsUserPanelOpen(false);
      }
    };

    if (isUserPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserPanelOpen]);

  const handleSubmit = async () => {
    if (answer.trim() && !isSubmitting && !hasExpired) {
      setIsSubmitting(true);
      setShowWireExplosion(true);
      
      setTimeout(async () => {
        try {
          await onSubmit(answer.trim());
          setAnswer('');
        } catch (error) {
          console.error('Error submitting answer:', error);
        } finally {
          setIsSubmitting(false);
          setTimeout(() => setShowWireExplosion(false), 500);
        }
      }, 800);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const urgencyClass = hasExpired
    ? 'animate-shake border-red-500 bg-red-900/30'
    : isCritical
    ? 'animate-pulse-fast border-red-500 bg-red-900/20 shadow-red-500/50 shadow-2xl'
    : isUrgent
    ? 'animate-pulse border-orange-500 bg-orange-900/20 shadow-orange-500/30 shadow-xl'
    : `${TYPE_BORDERS[request.type]} ${TYPE_GLOWS[request.type]} shadow-lg`;

  return (
    <div className="flex justify-center items-center min-h-[60vh] relative">
      {/* Wire Explosion Effect */}
      {showWireExplosion && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <svg className="w-full h-full" style={{ filter: 'blur(1px)' }}>
            {Array.from({ length: 50 }).map((_, i) => {
              const angle = (i / 50) * Math.PI * 2;
              const distance = 200 + Math.random() * 300;
              const x1 = '50%';
              const y1 = '50%';
              const x2 = `${50 + Math.cos(angle) * (distance / window.innerWidth * 100)}%`;
              const y2 = `${50 + Math.sin(angle) * (distance / window.innerHeight * 100)}%`;
              const delay = Math.random() * 0.3;
              const duration = 0.5 + Math.random() * 0.3;
              
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(59, 130, 246, 0.8)"
                  strokeWidth="2"
                  className="wire-explosion-line"
                  style={{
                    animation: `wireExplode ${duration}s ease-out ${delay}s forwards`,
                    strokeDasharray: '5,5',
                  }}
                />
              );
            })}
            {Array.from({ length: 30 }).map((_, i) => {
              const angle = (i / 30) * Math.PI * 2;
              const distance = 150 + Math.random() * 200;
              const x = `${50 + Math.cos(angle) * (distance / window.innerWidth * 100)}%`;
              const y = `${50 + Math.sin(angle) * (distance / window.innerHeight * 100)}%`;
              const delay = Math.random() * 0.2;
              const duration = 0.4 + Math.random() * 0.2;
              
              return (
                <circle
                  key={`node-${i}`}
                  cx={x}
                  cy={y}
                  r="3"
                  fill="rgba(59, 130, 246, 1)"
                  className="wire-explosion-node"
                  style={{
                    animation: `wireNodePulse ${duration}s ease-out ${delay}s forwards`,
                    filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.8))',
                  }}
                />
              );
            })}
          </svg>
          <style>{`
            @keyframes wireExplode {
              0% {
                opacity: 1;
                stroke-dashoffset: 0;
              }
              100% {
                opacity: 0;
                stroke-dashoffset: 100;
              }
            }
            @keyframes wireNodePulse {
              0% {
                opacity: 1;
                transform: scale(1);
              }
              50% {
                opacity: 0.8;
                transform: scale(1.5);
              }
              100% {
                opacity: 0;
                transform: scale(0.5);
              }
            }
          `}</style>
        </div>
      )}
      
      <div
        className={`
          relative w-full max-w-2xl bg-black/60 backdrop-blur-sm
          rounded-lg border p-8
          transition-all duration-300
          ${urgencyClass}
          ${hasExpired ? '' : 'hover:scale-[1.01] hover:shadow-2xl'}
          transform-gpu
          animate-fade-in
        `}
        style={{
          borderColor: hasExpired 
            ? '#ef4444' 
            : isCritical 
            ? '#ef4444' 
            : isUrgent 
            ? '#f97316' 
            : TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'blue' ? '#3b82f6' : TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'purple' ? '#a855f7' : TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'green' ? '#22c55e' : '#ec4899',
          boxShadow: hasExpired 
            ? '0 0 20px rgba(239, 68, 68, 0.5)' 
            : isCritical 
            ? '0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.1)' 
            : isUrgent 
            ? '0 0 20px rgba(249, 115, 22, 0.4)' 
            : `0 0 20px ${TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'blue' ? 'rgba(59, 130, 246, 0.3)' : TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'purple' ? 'rgba(168, 85, 247, 0.3)' : TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'green' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(236, 72, 153, 0.3)'}, inset 0 0 20px ${TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'blue' ? 'rgba(59, 130, 246, 0.1)' : TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'purple' ? 'rgba(168, 85, 247, 0.1)' : TYPE_BORDERS[request.type].replace('border-', '').split('-')[0] === 'green' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(236, 72, 153, 0.1)'}`,
          animation: hasExpired 
            ? 'shake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) 3' 
            : isCritical 
            ? 'pulse 0.8s cubic-bezier(0.4, 0, 0.6, 1) infinite' 
            : undefined,
        }}
      >
        {/* User info and Request type badge */}
        <div className="flex items-center justify-between mb-4">
          <div className={`inline-block px-4 py-2 rounded text-xs font-['Orbitron'] font-bold ${TYPE_COLORS[request.type]} shadow-lg tracking-wider`}>
            {request.type}
          </div>
          
          {request.userName && (
            <div className="relative" ref={userPanelRef}>
              <div
                className="text-sm text-gray-400 font-['Rajdhani'] cursor-pointer hover:text-cyan-400 transition-colors"
                onMouseEnter={() => {
                  setShowUserHover(true);
                }}
                onMouseLeave={() => {
                  if (!isUserPanelOpen) {
                    setShowUserHover(false);
                  }
                }}
                onClick={() => {
                  setIsUserPanelOpen(!isUserPanelOpen);
                  if (!isUserPanelOpen) {
                    setShowUserHover(true);
                  }
                }}
              >
                <span className="text-cyan-400 font-semibold">{request.userName}</span>
                {request.requestDate && request.requestTime && (
                  <span className="ml-2 text-gray-500">
                    • {request.requestDate} at {request.requestTime}
                  </span>
                )}
              </div>
              
              {(showUserHover || isUserPanelOpen) && request.chatHistory && (
                <div 
                  className="absolute right-0 top-full mt-2 w-64 bg-black/95 backdrop-blur-sm border border-cyan-500/50 rounded-lg p-4 shadow-2xl z-50 animate-fade-in"
                  style={{ boxShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                  onMouseEnter={() => {
                    setShowUserHover(true);
                  }}
                  onMouseLeave={() => {
                    setShowUserHover(false);
                    if (isUserPanelOpen) {
                      setIsUserPanelOpen(false);
                    }
                  }}
                >
                  <div className="text-cyan-400 font-['Orbitron'] font-bold text-sm mb-3 border-b border-cyan-500/30 pb-2">
                    CHAT HISTORY
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {request.chatHistory.map((chat, idx) => (
                      <div key={idx} className="text-xs font-['Rajdhani'] text-gray-300 border-b border-gray-800/50 pb-2 last:border-0 hover:bg-cyan-500/10 rounded px-2 py-1 transition-colors cursor-pointer">
                        <div className="text-white font-semibold">{chat.chatName}</div>
                        <div className="text-gray-500 text-[10px] mt-1">{chat.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Difficulty indicator */}
        <div className="text-sm text-gray-400 mb-4 flex items-center gap-2 font-['Rajdhani']">
          <span className="font-light">DIFFICULTY:</span>
          <span className="text-yellow-400 text-lg font-bold">
            {'★'.repeat(request.difficulty)}
          </span>
          <span className="ml-auto text-gray-500 font-light">
            TIME LIMIT: {request.timeLimit}s
          </span>
        </div>

        {/* Request text */}
        <div className="mb-6">
          <h2 className="text-2xl text-white font-['Rajdhani'] font-semibold leading-relaxed">
            {request.text}
          </h2>
        </div>

        {/* Timer bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2 font-['Rajdhani']">
            <span className="text-gray-400 font-light">TIME REMAINING</span>
            <span className={`font-bold text-lg transition-colors ${
              isCritical 
                ? 'text-red-400 animate-pulse' 
                : isUrgent 
                ? 'text-orange-400' 
                : 'text-cyan-400'
            }`}>
              {request.timeRemaining.toFixed(1)}s
            </span>
          </div>
          <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-100 ease-linear ${
                isCritical
                  ? 'bg-gradient-to-r from-red-600 to-red-400 animate-pulse'
                  : isUrgent
                  ? 'bg-gradient-to-r from-orange-600 to-orange-400'
                  : 'bg-gradient-to-r from-blue-600 to-blue-400'
              }`}
              style={{ 
                width: `${Math.max(0, timePercentage)}%`,
                boxShadow: isCritical ? '0 0 10px rgba(239, 68, 68, 0.8)' : undefined,
              }}
            />
          </div>
        </div>

        {/* Answer input box with typing indicator */}
        {!hasExpired ? (
          <div className="space-y-3">
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-sm text-gray-400 mb-2 animate-fade-in">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="ml-2">👤 Player (You)</span>
              </div>
            )}
            
            <textarea
              ref={inputRef}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here..."
              className="w-full bg-black/40 border border-gray-700 rounded-lg px-4 py-4 text-white 
                       placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 
                       focus:border-cyan-500 resize-none transition-all duration-200
                       hover:bg-black/60 font-['Rajdhani'] text-lg"
              rows={6}
              disabled={isSubmitting}
              style={{
                fontFamily: "'Rajdhani', sans-serif",
              }}
            />
            
            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!answer.trim() || isSubmitting}
                className={`
                  flex-1 font-['Orbitron'] font-bold py-4 px-6 rounded-lg transition-all duration-200 text-lg
                  transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide
                  ${answer.trim() && !isSubmitting
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg'
                    : 'bg-black/60 border border-gray-700 text-gray-400'
                  }
                `}
                style={answer.trim() && !isSubmitting ? {
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                } : {}}
              >
                {isSubmitting ? 'ANALYZING WITH AI...' : 'SUBMIT ANSWER (ENTER)'}
              </button>
              {onSkip && (
                <div className="relative">
                  <button
                    onClick={async () => {
                      await soundManager.resumeAudioContext();
                      onSkip();
                    }}
                    onMouseEnter={() => setShowSkipTooltip(true)}
                    onMouseLeave={() => setShowSkipTooltip(false)}
                    disabled={isSubmitting}
                    className="px-6 py-4 bg-black/60 border-2 border-orange-500/50 text-orange-400 font-['Orbitron'] font-semibold rounded-lg hover:bg-black/80 hover:border-orange-500 hover:text-orange-300 transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide flex items-center gap-2 relative"
                    style={{
                      boxShadow: showSkipTooltip 
                        ? '0 0 25px rgba(249, 115, 22, 0.6)' 
                        : '0 0 15px rgba(249, 115, 22, 0.3)',
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    SKIP
                  </button>
                  {showSkipTooltip && (
                    <div 
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-red-900/95 backdrop-blur-sm border-2 border-red-500/80 rounded-lg shadow-2xl z-50 animate-fade-in whitespace-nowrap"
                      style={{ 
                        boxShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
                      }}
                      onMouseEnter={() => setShowSkipTooltip(true)}
                      onMouseLeave={() => setShowSkipTooltip(false)}
                    >
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17l5-5m0 0l-5-5m5 5H6" />
                        </svg>
                        <span className="text-red-400 font-['Orbitron'] font-bold text-sm">
                          SCORE -5
                        </span>
                      </div>
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500/80"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-red-400 font-bold text-2xl animate-pulse mb-2">
              ⚠️ Time's Up!
            </div>
            <div className="text-gray-400 text-lg">You lost a life</div>
          </div>
        )}
      </div>
    </div>
  );
}
