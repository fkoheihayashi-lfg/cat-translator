import { CatAvatarProps } from '../components/CatAvatar';
import { analyzeLocalRecording } from '../audio/localAnalysis/analyzeLocalRecording';
import {
  AnalysisMode,
  AudioFeatures,
  ClipQualityInput,
  ConfidenceBand,
  EnvironmentTrigger,
  IntentBucket,
  LocationContext,
  MealContext,
  OwnerContext,
  ScoreBreakdown,
  ActivityContext,
} from '../audio/localAnalysis/types';
import { AppLanguage } from '../i18n/strings';
import { CatPersonaState, CatProfileLike } from './catPersona';
import { HourBucket } from '../utils/timeBuckets';

export type CatInterpretation = {
  mood: string;
  catSubtitle: string;
  translatedText: string;
  summaryText: string;
  soundKey: string;
  source: 'local';
  inputMode: 'recording';
  primaryIntent: IntentBucket;
  confidenceBand: ConfidenceBand;
  analysisMode: AnalysisMode;
  features: AudioFeatures;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
};

export type AnalyzeCatAudioInput = {
  recordingUri?: string;
  durationMs?: number;
  language?: AppLanguage;
  profile?: CatProfileLike;
  personaState?: CatPersonaState;
  log?: Array<{
    direction: 'cat_to_human' | 'human_to_cat';
    rawText: string;
    translatedText: string;
    soundKey: string;
    mood: string;
    createdAt: number;
    inputMode: 'recording' | 'text';
  }>;
  clipQuality?: ClipQualityInput;
  timeBucket?: HourBucket;
  mealContext?: MealContext;
  ownerContext?: OwnerContext;
  environmentTrigger?: EnvironmentTrigger;
  activityContext?: ActivityContext;
  locationContext?: LocationContext;
};

export type LocalAnalysisStatus = {
  provider: 'local';
  ready: true;
};

const INTENT_TO_MOOD: Record<IntentBucket, string> = {
  attention_like: '甘え',
  food_like: '要求',
  playful: '興味',
  curious: '興味',
  unsettled: '不満',
  sleepy: '安心',
  unknown: '様子見',
};

const INTENT_TO_SOUND: Record<IntentBucket, string> = {
  attention_like: 'love',
  food_like: 'food',
  playful: 'play',
  curious: 'play',
  unsettled: 'no',
  sleepy: 'sleep',
  unknown: 'default',
};

export const MOOD_AVATAR: Record<string, CatAvatarProps['mood']> = {
  甘え: 'happy',
  要求: 'hungry',
  不満: 'upset',
  興味: 'curious',
  安心: 'sleepy',
  様子見: 'neutral',
};

export function getAvatarMoodFromInterpretation(
  interpretation: Pick<CatInterpretation, 'mood'>
): CatAvatarProps['mood'] {
  return MOOD_AVATAR[interpretation.mood] ?? 'neutral';
}

export function getLocalAnalysisDebugLabel(
  status: LocalAnalysisStatus | null
): string {
  if (!__DEV__) return '';
  if (!status) return 'LOCAL ANALYSIS · STARTING';
  return 'LOCAL ANALYSIS · HEURISTIC';
}

export async function analyzeCatAudio(
  input: AnalyzeCatAudioInput = {}
): Promise<CatInterpretation> {
  const localResult = await analyzeLocalRecording(input.recordingUri, {
    language: input.language,
    profile: input.profile,
    personaState: input.personaState,
    log: input.log,
    durationMs: input.durationMs,
    clipQuality: input.clipQuality,
    timeBucket: input.timeBucket,
    mealContext: input.mealContext,
    ownerContext: input.ownerContext,
    environmentTrigger: input.environmentTrigger,
    activityContext: input.activityContext,
    locationContext: input.locationContext,
  });

  return {
    mood: INTENT_TO_MOOD[localResult.primaryIntent],
    catSubtitle: localResult.catSubtitle,
    translatedText: localResult.summaryText,
    summaryText: localResult.summaryText,
    soundKey: INTENT_TO_SOUND[localResult.primaryIntent],
    source: 'local',
    inputMode: 'recording',
    primaryIntent: localResult.primaryIntent,
    confidenceBand: localResult.confidenceBand,
    analysisMode: localResult.analysisMode,
    features: localResult.features,
    scoreBreakdown: localResult.scoreBreakdown,
    reasons: localResult.reasons,
  };
}

export type CatResult = CatInterpretation;
