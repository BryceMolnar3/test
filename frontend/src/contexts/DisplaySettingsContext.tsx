import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorMode } from '@chakra-ui/react';

interface DisplaySettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}

interface DisplaySettingsContextType {
  settings: DisplaySettings;
  updateSettings: (newSettings: Partial<DisplaySettings>) => void;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextType | undefined>(undefined);

export function DisplaySettingsProvider({ children }: { children: React.ReactNode }) {
  const { colorMode, setColorMode } = useColorMode();
  const [settings, setSettings] = useState<DisplaySettings>({
    theme: 'light',
    fontSize: 'medium',
  });

  useEffect(() => {
    // Load settings from localStorage on mount
    const savedSettings = localStorage.getItem('displaySettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        applySettings(parsed);
      } catch (error) {
        console.error('Error parsing saved settings:', error);
      }
    }
  }, []);

  // Sync Chakra color mode with our theme setting
  useEffect(() => {
    setColorMode(settings.theme);
  }, [settings.theme, setColorMode]);

  const applySettings = (newSettings: Partial<DisplaySettings>) => {
    // Apply font size
    if (newSettings.fontSize) {
      document.documentElement.style.fontSize = {
        small: '14px',
        medium: '16px',
        large: '18px'
      }[newSettings.fontSize];
    }
  };

  const updateSettings = (newSettings: Partial<DisplaySettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    applySettings(newSettings);
    localStorage.setItem('displaySettings', JSON.stringify(updatedSettings));
  };

  return (
    <DisplaySettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}

export function useDisplaySettings() {
  const context = useContext(DisplaySettingsContext);
  if (context === undefined) {
    throw new Error('useDisplaySettings must be used within a DisplaySettingsProvider');
  }
  return context;
} 