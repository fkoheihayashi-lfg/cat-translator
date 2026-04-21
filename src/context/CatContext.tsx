import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppLanguage } from '../i18n/strings';
import { buildCatPersonaState, CatPersonaState } from '../logic/catPersona';

export type LogEntry = {
  id: number;
  direction: 'cat_to_human' | 'human_to_cat';
  rawText: string;       // cat phonetic sound, e.g. "にゃーっ！"
  translatedText: string; // human-readable translation
  catSubtitle: string;   // display subtitle in result card
  soundKey: string;      // key into SOUND_MAP
  mood: string;          // mood label (e.g. '甘え'), '' if unknown
  createdAt: number;     // Date.now()
  source: 'mock' | 'ai' | 'yamnet_server';
  inputMode: 'recording' | 'text';
  recordingUri?: string;
};

export type CatProfile = {
  name: string;
  personality: string;
};

type CatContextType = {
  profile: CatProfile;
  language: AppLanguage;
  personaState: CatPersonaState;
  setProfile: (p: CatProfile) => void;
  setLanguage: (language: AppLanguage) => void;
  log: LogEntry[];
  addLog: (entry: Omit<LogEntry, 'id' | 'createdAt'>) => void;
};

const KEYS = {
  profile: '@cat_profile',
  log: '@cat_log',
  language: '@app_language',
} as const;

const DEFAULT_PROFILE: CatProfile = { name: '', personality: '甘えん坊' };
const DEFAULT_LANGUAGE: AppLanguage = 'ja';

// Migrate entries written before the LogEntry type was normalised.
// Old shape: { id, direction, catSound, text, timestamp }
function migrateEntry(raw: any): LogEntry {
  if (typeof raw.rawText === 'string') {
    return {
      id:             raw.id ?? Date.now(),
      direction:      raw.direction ?? 'cat_to_human',
      rawText:        raw.rawText ?? '',
      translatedText: raw.translatedText ?? '',
      catSubtitle:    raw.catSubtitle ?? raw.rawText ?? '',
      soundKey:       raw.soundKey ?? 'default',
      mood:           raw.mood ?? '',
      createdAt:      raw.createdAt ?? raw.id ?? Date.now(),
      source:         raw.source ?? 'mock',
      inputMode:      raw.inputMode ?? (raw.direction === 'human_to_cat' ? 'text' : 'recording'),
      recordingUri:
        typeof raw.recordingUri === 'string' && raw.recordingUri.length > 0
          ? raw.recordingUri
          : undefined,
    };
  }
  return {
    id:            raw.id            ?? Date.now(),
    direction:     raw.direction     ?? 'cat_to_human',
    rawText:       raw.catSound      ?? '',
    translatedText: raw.text         ?? '',
    catSubtitle:   raw.catSound      ?? '',
    soundKey:      'default',
    mood:          '',
    createdAt:     raw.id            ?? Date.now(),
    source:        'mock',
    inputMode:     raw.direction === 'human_to_cat' ? 'text' : 'recording',
    recordingUri:
      typeof raw.recordingUri === 'string' && raw.recordingUri.length > 0
        ? raw.recordingUri
        : undefined,
  };
}

const CatContext = createContext<CatContextType | null>(null);

function migrateProfile(raw: any): CatProfile {
  return {
    name: typeof raw?.name === 'string' ? raw.name : '',
    personality:
      typeof raw?.personality === 'string' && raw.personality.length > 0
        ? raw.personality
        : DEFAULT_PROFILE.personality,
  };
}

export function CatProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<CatProfile>(DEFAULT_PROFILE);
  const [language, setLanguageState] = useState<AppLanguage>(DEFAULT_LANGUAGE);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [profileRaw, logRaw, languageRaw] = await AsyncStorage.multiGet([
          KEYS.profile,
          KEYS.log,
          KEYS.language,
        ]);
        if (profileRaw[1]) setProfileState(migrateProfile(JSON.parse(profileRaw[1])));
        if (logRaw[1]) setLog((JSON.parse(logRaw[1]) as any[]).map(migrateEntry));
        if (languageRaw[1] === 'ja' || languageRaw[1] === 'en') {
          setLanguageState(languageRaw[1]);
        }
      } catch {
        // Corrupt data — fall back to defaults silently
      } finally {
        setReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEYS.profile, JSON.stringify(profile)).catch(() => {});
  }, [profile, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEYS.language, language).catch(() => {});
  }, [language, ready]);

  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEYS.log, JSON.stringify(log)).catch(() => {});
  }, [log, ready]);

  const setProfile = (p: CatProfile) => setProfileState(p);
  const setLanguage = (nextLanguage: AppLanguage) => setLanguageState(nextLanguage);
  const personaState = buildCatPersonaState(profile, log);

  const addLog = (entry: Omit<LogEntry, 'id' | 'createdAt'>) => {
    const now = Date.now();
    setLog((prev) => [...prev, { ...entry, id: now, createdAt: now }]);
  };

  if (!ready) return null;

  return (
    <CatContext.Provider
      value={{ profile, language, personaState, setProfile, setLanguage, log, addLog }}
    >
      {children}
    </CatContext.Provider>
  );
}

export function useCat(): CatContextType {
  const ctx = useContext(CatContext);
  if (!ctx) throw new Error('useCat must be used inside CatProvider');
  return ctx;
}
