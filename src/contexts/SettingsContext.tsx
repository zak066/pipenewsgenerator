import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Settings } from '../types';
import { electronApi } from '../api/electron';

interface SettingsContextType {
  settings: Settings;
  loading: boolean;
  updateSetting: (key: keyof Settings, value: string) => void;
  saveSetting: (key: keyof Settings) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await electronApi.getSettings();
        setSettings({
          bitly_token: data.bitly_token || '',
          whatsapp_number: data.whatsapp_number || '',
          tinyurl_token: data.tinyurl_token || '',
        });
      } catch (err) {
        console.error('Error loading settings:', err);
      }
      setLoading(false);
    };
    load();
  }, []);

  const updateSetting = useCallback((key: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  const saveSetting = useCallback(async (key: keyof Settings): Promise<boolean> => {
    try {
      const value = settings[key] || '';
      await electronApi.setSetting(key, value);
      return true;
    } catch (err) {
      console.error('Error saving setting:', err);
      return false;
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, loading, updateSetting, saveSetting }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within SettingsProvider');
  return context;
}