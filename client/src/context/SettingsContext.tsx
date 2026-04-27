import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface Settings {
  app_name: string;
  school_name: string;
  school_logo: string;
}

interface SettingsContextType {
  settings: Settings;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>({
    app_name: 'Jariku Mansaba',
    school_name: '',
    school_logo: ''
  });

  const refreshSettings = async () => {
    try {
      const res = await axios.get('/api/settings/public');
      const sMap: any = {};
      res.data.forEach((s: any) => {
        sMap[s.key] = s.value;
      });
      
      if (sMap.app_name) {
         setSettings(prev => ({ ...prev, app_name: sMap.app_name }));
         document.title = sMap.app_name;
      }
      if (sMap.school_name) setSettings(prev => ({ ...prev, school_name: sMap.school_name }));
      if (sMap.school_logo) setSettings(prev => ({ ...prev, school_logo: sMap.school_logo }));
    } catch (err) {
      console.error("Gagal memuat pengaturan global");
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within a SettingsProvider');
  return context;
};
