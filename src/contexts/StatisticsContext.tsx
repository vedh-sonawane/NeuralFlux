import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface GameStatistics {
  totalGames: number;
  bestScore: number;
  totalScore: number;
  averageScore: number;
  totalTimePlayed: number;
  bestDifficulty: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  longestStreak: number;
  currentStreak: number;
  achievements: string[];
  bestTime: number;
  perfectAnswers: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

const defaultStats: GameStatistics = {
  totalGames: 0,
  bestScore: 0,
  totalScore: 0,
  averageScore: 0,
  totalTimePlayed: 0,
  bestDifficulty: 0,
  totalQuestionsAnswered: 0,
  correctAnswers: 0,
  longestStreak: 0,
  currentStreak: 0,
  achievements: [],
  bestTime: 0,
  perfectAnswers: 0,
};

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_game', name: 'First Steps', description: 'Complete your first game', icon: '🎮', unlocked: false },
  { id: 'score_1000', name: 'Getting Started', description: 'Score 1,000 points in a single game', icon: '⭐', unlocked: false },
  { id: 'score_5000', name: 'Rising Star', description: 'Score 5,000 points in a single game', icon: '🌟', unlocked: false },
  { id: 'score_10000', name: 'Elite Player', description: 'Score 10,000 points in a single game', icon: '💫', unlocked: false },
  { id: 'score_20000', name: 'Master', description: 'Score 20,000 points in a single game', icon: '👑', unlocked: false },
  { id: 'streak_5', name: 'On Fire', description: 'Get a 5-answer streak', icon: '🔥', unlocked: false },
  { id: 'streak_10', name: 'Unstoppable', description: 'Get a 10-answer streak', icon: '⚡', unlocked: false },
  { id: 'streak_20', name: 'Perfect Flow', description: 'Get a 20-answer streak', icon: '✨', unlocked: false },
  { id: 'difficulty_5', name: 'Challenge Accepted', description: 'Reach difficulty level 5', icon: '🎯', unlocked: false },
  { id: 'difficulty_10', name: 'Extreme Challenge', description: 'Reach difficulty level 10', icon: '🏆', unlocked: false },
  { id: 'time_60', name: 'Survivor', description: 'Survive for 60 seconds', icon: '⏱️', unlocked: false },
  { id: 'time_120', name: 'Endurance', description: 'Survive for 2 minutes', icon: '💪', unlocked: false },
  { id: 'time_300', name: 'Marathon', description: 'Survive for 5 minutes', icon: '🏃', unlocked: false },
  { id: 'perfect_answer', name: 'Perfectionist', description: 'Get a perfect score on an answer', icon: '💯', unlocked: false },
  { id: 'games_10', name: 'Dedicated', description: 'Play 10 games', icon: '🎲', unlocked: false },
  { id: 'games_50', name: 'Veteran', description: 'Play 50 games', icon: '🎪', unlocked: false },
  { id: 'games_100', name: 'Legend', description: 'Play 100 games', icon: '🏅', unlocked: false },
];

interface StatisticsContextType {
  stats: GameStatistics;
  achievements: Achievement[];
  updateStats: (updates: Partial<GameStatistics>) => void;
  recordGame: (score: number, time: number, difficulty: number, questionsAnswered: number, correctAnswers: number, perfectAnswers?: number) => void;
  updateStreak: (increment: boolean) => void;
  checkAchievements: () => void;
}

const StatisticsContext = createContext<StatisticsContextType | undefined>(undefined);

export const StatisticsProvider = ({ children }: { children: ReactNode }) => {
  const [stats, setStats] = useState<GameStatistics>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('neural-flux-stats');
        if (saved) {
          try {
            return { ...defaultStats, ...JSON.parse(saved) };
          } catch {
            return defaultStats;
          }
        }
      }
    } catch (error) {
      console.error('Error loading stats from localStorage:', error);
    }
    return defaultStats;
  });

  const [achievements, setAchievements] = useState<Achievement[]>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('neural-flux-achievements');
        if (saved) {
          try {
            const savedAchievements = JSON.parse(saved);
            return ACHIEVEMENTS.map(ach => {
              const saved = savedAchievements.find((a: Achievement) => a.id === ach.id);
              return saved ? { ...ach, unlocked: saved.unlocked } : ach;
            });
          } catch {
            return ACHIEVEMENTS;
          }
        }
      }
    } catch (error) {
      console.error('Error loading achievements from localStorage:', error);
    }
    return ACHIEVEMENTS;
  });

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('neural-flux-stats', JSON.stringify(stats));
      }
    } catch (error) {
      console.error('Error saving stats to localStorage:', error);
    }
  }, [stats]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('neural-flux-achievements', JSON.stringify(achievements));
      }
    } catch (error) {
      console.error('Error saving achievements to localStorage:', error);
    }
  }, [achievements]);

  const updateStats = (updates: Partial<GameStatistics>) => {
    setStats(prev => ({ ...prev, ...updates }));
  };

  const recordGame = (score: number, time: number, difficulty: number, questionsAnswered: number, correctAnswers: number, perfectAnswers: number = 0) => {
    setStats(prev => {
      const newTotalGames = prev.totalGames + 1;
      const newTotalScore = prev.totalScore + score;
      const newAverageScore = Math.round(newTotalScore / newTotalGames);
      const newTotalTimePlayed = prev.totalTimePlayed + time;
      const newBestScore = Math.max(prev.bestScore, score);
      const newBestDifficulty = Math.max(prev.bestDifficulty, difficulty);
      const newTotalQuestionsAnswered = prev.totalQuestionsAnswered + questionsAnswered;
      const newCorrectAnswers = prev.correctAnswers + correctAnswers;

      return {
        ...prev,
        totalGames: newTotalGames,
        totalScore: newTotalScore,
        averageScore: newAverageScore,
        totalTimePlayed: newTotalTimePlayed,
        bestScore: newBestScore,
        bestDifficulty: newBestDifficulty,
        totalQuestionsAnswered: newTotalQuestionsAnswered,
        correctAnswers: newCorrectAnswers,
        bestTime: Math.max(prev.bestTime, time),
        perfectAnswers: prev.perfectAnswers + perfectAnswers,
      };
    });
  };

  const updateStreak = (increment: boolean) => {
    setStats(prev => {
      if (increment) {
        const newStreak = prev.currentStreak + 1;
        return {
          ...prev,
          currentStreak: newStreak,
          longestStreak: Math.max(prev.longestStreak, newStreak),
        };
      } else {
        return {
          ...prev,
          currentStreak: 0,
        };
      }
    });
  };

  const checkAchievements = () => {
    setAchievements(prev => {
      const newAchievements = prev.map(ach => {
        if (ach.unlocked) return ach;

        let shouldUnlock = false;

        switch (ach.id) {
          case 'first_game':
            shouldUnlock = stats.totalGames >= 1;
            break;
          case 'score_1000':
            shouldUnlock = stats.bestScore >= 1000;
            break;
          case 'score_5000':
            shouldUnlock = stats.bestScore >= 5000;
            break;
          case 'score_10000':
            shouldUnlock = stats.bestScore >= 10000;
            break;
          case 'score_20000':
            shouldUnlock = stats.bestScore >= 20000;
            break;
          case 'streak_5':
            shouldUnlock = stats.longestStreak >= 5;
            break;
          case 'streak_10':
            shouldUnlock = stats.longestStreak >= 10;
            break;
          case 'streak_20':
            shouldUnlock = stats.longestStreak >= 20;
            break;
          case 'difficulty_5':
            shouldUnlock = stats.bestDifficulty >= 5;
            break;
          case 'difficulty_10':
            shouldUnlock = stats.bestDifficulty >= 10;
            break;
          case 'time_60':
            shouldUnlock = stats.bestTime >= 60;
            break;
          case 'time_120':
            shouldUnlock = stats.bestTime >= 120;
            break;
          case 'time_300':
            shouldUnlock = stats.bestTime >= 300;
            break;
          case 'perfect_answer':
            shouldUnlock = stats.perfectAnswers > 0;
            break;
          case 'games_10':
            shouldUnlock = stats.totalGames >= 10;
            break;
          case 'games_50':
            shouldUnlock = stats.totalGames >= 50;
            break;
          case 'games_100':
            shouldUnlock = stats.totalGames >= 100;
            break;
        }

        if (shouldUnlock && !ach.unlocked) {
          return { ...ach, unlocked: true };
        }
        return ach;
      });

      const newlyUnlocked = newAchievements.filter((a, i) => !prev[i].unlocked && a.unlocked);
      if (newlyUnlocked.length > 0) {
        setTimeout(() => {
          const event = new CustomEvent('achievement-unlocked', { 
            detail: newlyUnlocked.map(a => ({ name: a.name, icon: a.icon }))
          });
          window.dispatchEvent(event);
        }, 100);
      }

      return newAchievements;
    });
  };

  return (
    <StatisticsContext.Provider value={{ stats, achievements, updateStats, recordGame, updateStreak, checkAchievements }}>
      {children}
    </StatisticsContext.Provider>
  );
};

export const useStatistics = () => {
  const context = useContext(StatisticsContext);
  if (!context) {
    throw new Error('useStatistics must be used within StatisticsProvider');
  }
  return context;
};
