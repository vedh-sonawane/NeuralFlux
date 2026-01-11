import { useState, useEffect } from 'react';
import Game from './components/Game';
import Homepage from './components/Homepage';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';
import { StatisticsProvider } from './contexts/StatisticsContext';
import { soundManager } from './utils/sounds';

soundManager.init();

function AppContent() {
  const [gameStarted, setGameStarted] = useState(false);
  const { settings } = useSettings();

  useEffect(() => {
    soundManager.setSoundEffectsEnabled(settings.soundEffects);
    soundManager.setSoundVolume(settings.soundVolume);
    soundManager.setMusicVolume(settings.musicVolume);
    
    const initAudio = async () => {
      const resumed = await soundManager.resumeAudioContext();
      if (resumed || settings.backgroundMusic) {
        soundManager.setBackgroundMusicEnabled(settings.backgroundMusic);
      }
    };
    
    // Try to initialize audio, but it may need user interaction
    initAudio().catch(err => console.warn('Audio init error:', err));
  }, [settings.soundEffects, settings.backgroundMusic, settings.soundVolume, settings.musicVolume]);

  return (
    <>
      {!gameStarted ? (
        <Homepage onStartGame={() => setGameStarted(true)} />
      ) : (
        <Game onBackToHome={() => setGameStarted(false)} />
      )}
    </>
  );
}

function App() {
  return (
    <SettingsProvider>
      <StatisticsProvider>
        <AppContent />
      </StatisticsProvider>
    </SettingsProvider>
  );
}

export default App;
