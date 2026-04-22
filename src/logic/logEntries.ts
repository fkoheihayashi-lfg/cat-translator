import { LogEntry } from '../context/CatContext';
import { CatInterpretation } from './analyzeCatAudio';
import { CatReply } from './generateCatReply';
import { HumanToCatIntentId } from './humanToCatIntents';

export type NewLogEntry = Omit<LogEntry, 'id' | 'createdAt'>;

export function buildHumanToCatLogEntry(
  reply: CatReply,
  source:
    | { type: 'text'; userText: string }
    | { type: 'intent'; intentId: HumanToCatIntentId; displayLabel: string }
): NewLogEntry {
  return {
    direction: 'human_to_cat',
    rawText: reply.catSound,
    translatedText: reply.responseText,
    catSubtitle: reply.catSound,
    userText: source.type === 'text' ? source.userText : undefined,
    humanIntentId: source.type === 'intent' ? source.intentId : undefined,
    humanIntentLabel: source.type === 'intent' ? source.displayLabel : undefined,
    soundKey: reply.soundKey,
    mood: reply.mood,
    source: 'local',
    inputMode: 'text',
    primaryIntent: undefined,
    confidenceBand: undefined,
    analysisMode: undefined,
  };
}

export function buildCatToHumanLogEntry(
  interpretation: CatInterpretation,
  recordingUri?: string
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
    recordingUri,
    primaryIntent: interpretation.primaryIntent,
    confidenceBand: interpretation.confidenceBand,
    analysisMode: interpretation.analysisMode,
  };
}
