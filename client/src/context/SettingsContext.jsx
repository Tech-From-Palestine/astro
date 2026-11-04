import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const SettingsCtx = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [categories, setCategories] = useState([]);

  const reload = () => {
    api.get('/settings').then(setSettings).catch(() => setSettings({}));
    api.get('/categories').then(setCategories).catch(() => {});
  };
  useEffect(reload, []);

  return (
    <SettingsCtx.Provider value={{ settings, categories, reload, currency: settings?.currency || '₪' }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export const useSettings = () => useContext(SettingsCtx);
