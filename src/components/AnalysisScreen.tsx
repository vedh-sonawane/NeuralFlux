import { AnalysisResult } from '../types';
import { soundManager } from '../utils/sounds';

interface AnalysisScreenProps {
  analysis: AnalysisResult;
  onContinue: () => void;
  onClose?: () => void;
}

export default function AnalysisScreen({ analysis, onContinue, onClose }: AnalysisScreenProps) {
  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-green-400';
    if (percentage >= 60) return 'text-yellow-400';
    if (percentage >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getScoreBarColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      {onClose && (
        <button
          onClick={async () => {
            await soundManager.resumeAudioContext();
            soundManager.playBack();
            onClose?.();
          }}
          className="fixed top-6 right-6 w-14 h-14 flex items-center justify-center 
                   text-white text-4xl font-bold rounded-full 
                   bg-red-500/10 border-2 border-red-500/30
                   hover:bg-red-500/30 hover:border-red-500 
                   hover:shadow-[0_0_30px_rgba(239,68,68,0.8),0_0_60px_rgba(239,68,68,0.5),inset_0_0_20px_rgba(239,68,68,0.3)]
                   hover:scale-110
                   active:scale-95
                   transition-all duration-300 ease-out
                   backdrop-blur-sm
                   group"
          style={{ 
            zIndex: 60,
            transform: 'translateZ(0)',
          }}
        >
          <span className="relative z-10 group-hover:text-red-400 transition-colors duration-300">×</span>
        </button>
      )}
      <div className="bg-black/80 backdrop-blur-sm rounded-lg border border-gray-800/50 p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
           style={{ boxShadow: '0 0 40px rgba(59, 130, 246, 0.3), inset 0 0 40px rgba(59, 130, 246, 0.1)' }}>
        <h2 className="text-3xl font-['Orbitron'] font-black mb-6 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent tracking-tight">
          ANALYSIS RESULTS
        </h2>

        {/* Total Score */}
        <div className="mb-8 text-center">
          <div className="text-5xl font-['Orbitron'] font-black mb-2 text-white">
            {Math.round(analysis.totalScore)} / 1200
          </div>
          <p className="text-gray-400 font-['Rajdhani'] font-light">TOTAL SCORE</p>
        </div>

        {/* Example Response vs User Answer */}
        <div className="mb-8 space-y-4">
          <div>
            <h3 className="text-lg font-['Orbitron'] font-bold text-cyan-400 mb-2 tracking-wide">📝 EXAMPLE RESPONSE</h3>
            <div className="bg-black/60 rounded-lg p-4 border border-cyan-500/30 font-['Rajdhani']">
              <p className="text-gray-300">{analysis.aiResponse}</p>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-['Orbitron'] font-bold text-green-400 mb-2 tracking-wide">👤 YOUR ANSWER</h3>
            <div className="bg-black/60 rounded-lg p-4 border border-green-500/30 font-['Rajdhani']">
              <p className="text-gray-300">{analysis.userAnswer}</p>
            </div>
          </div>
        </div>

        {/* Detailed Metrics */}
        <div className="space-y-4 mb-8">
          <h3 className="text-xl font-['Orbitron'] font-bold text-white mb-4 tracking-wide">DETAILED BREAKDOWN</h3>
          
          {Object.entries(analysis.metrics).map(([key, metric]) => (
            <div key={key} className="bg-black/60 rounded-lg p-4 border border-gray-800/50">
              <div className="flex justify-between items-center mb-2 font-['Rajdhani']">
                <span className="text-white font-semibold uppercase tracking-wide">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span className={`font-bold ${getScoreColor(metric.score, metric.max)}`}>
                  {Math.round(metric.score)} / {metric.max}
                </span>
              </div>
              <div className="w-full bg-gray-900 rounded-full h-2 mb-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(metric.score, metric.max)}`}
                  style={{ width: `${Math.min(100, (metric.score / metric.max) * 100)}%` }}
                />
              </div>
              <p className="text-sm text-gray-400 font-['Rajdhani'] font-light">{metric.details}</p>
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={async () => {
            await soundManager.resumeAudioContext();
            soundManager.playButtonClick();
            onContinue();
          }}
          className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 
                   text-white font-['Orbitron'] font-bold py-4 px-6 rounded-lg transition-all duration-200 
                   transform hover:scale-105 active:scale-95 shadow-lg tracking-wide"
          style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}
        >
          CONTINUE TO NEXT QUESTION
        </button>
      </div>
    </div>
  );
}
