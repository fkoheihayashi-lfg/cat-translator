import { LogEntry } from '../context/CatContext';
import { CatInterpretation } from './analyzeCatAudio';
import { CatReply } from './generateCatReply';

export type NewLogEntry = Omit<LogEntry, 'id' | 'createdAt'>;

export function buildHumanToCatLogEntry(reply: CatReply): NewLogEntry {
  return {
    direction: 'human_to_cat',
    rawText: reply.catSound,
    translatedText: reply.responseText,
    catSubtitle: reply.catSound,
    soundKey: reply.soundKey,
    mood: reply.mood,
    source: 'mock',
    inputMode: 'text',
  };
}

export function buildCatToHumanLogEntry(
  interpretation: CatInterpretation
): NewLogEntry {
  return {
    direction: 'cat_to_human',
    rawText: interpretation.catSubtitle,
    translatedText: interpretation.translatedText,
    catSubtitle: interpretation.catSubtitle,
    soundKey: interpretation.soundKey,
    mood: interpretation.mood,
    source: interpretation.source,
    inputMode: interpretation.inputMode,
  };
}
