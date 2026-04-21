import React, { createContext, useContext, useState } from 'react';

export type LogEntry = {
  id: number;
  direction: 'cat_to_human' | 'human_to_cat';
  catSound: string;
  text: string;
  timestamp: string;
};

type CatProfile = {
  name: string;
  personality: string;
};

type CatContextType = {
  profile: CatProfile;
  setProfile: (p: CatProfile) => void;
  log: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void;
};

const CatContext = createContext<CatContextType | null>(null);

export function CatProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CatProfile>({ name: '', personality: '甘えん坊' });
  const [log, setLog] = useState<LogEntry[]>([]);

  const addLog = (entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const timestamp =
      '今日 ' +
      new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
    setLog((prev) => [...prev, { ...entry, id: Date.now(), timestamp }]);
  };

  return (
    <CatContext.Provider value={{ profile, setProfile, log, addLog }}>
      {children}
    </CatContext.Provider>
  );
}

export function useCat(): CatContextType {
  const ctx = useContext(CatContext);
  if (!ctx) throw new Error('useCat must be used inside CatProvider');
  return ctx;
}
