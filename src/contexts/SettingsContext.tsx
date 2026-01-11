import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserAccount {
  name: string;
  pfp: string;
  location: string;
  email: string;
  phone: string;
  bio: string;
  website: string;
}

interface Settings {
  soundEffects: boolean;
  backgroundMusic: boolean;
  glitchEffects: boolean;
  circuitBoardBackground: boolean;
  soundVolume: number;
  musicVolume: number;
  account: UserAccount;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (updates: Partial<Settings>) => void;
  updateAccount: (updates: Partial<UserAccount>) => void;
}

const defaultAccount: UserAccount = {
  name: '',
  pfp: '',
  location: '',
  email: '',
  phone: '',
  bio: '',
  website: '',
};

const defaultSettings: Settings = {
  soundEffects: true,
  backgroundMusic: true,
  glitchEffects: true,
  circuitBoardBackground: true,
  soundVolume: 100,
  musicVolume: 100,
  account: defaultAccount,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('backpressure-settings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('backpressure-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateAccount = (updates: Partial<UserAccount>) => {
    setSettings(prev => ({
      ...prev,
      account: { ...prev.account, ...updates },
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, updateAccount }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;
};
