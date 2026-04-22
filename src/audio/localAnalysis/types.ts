import { AppLanguage } from '../../i18n/strings';
import { CatPersonaState, CatProfileLike, LogEntryLike } from '../../logic/catPersona';
import { HourBucket } from '../../utils/timeBuckets';

export type IntentBucket =
  | 'attention'
  | 'food_like'
  | 'playful'
  | 'curious'
  | 'unsettled'
  | 'sleepy'
  | 'unknown';

export type ConfidenceBand = 'low' | 'medium' | 'high';
export type AnalysisMode = 'local_audio_heuristic' | 'local_context_fallback';

export interface AudioFeatures {
  durationMs: number;
  rmsMean?: number;
  rmsPeak?: number;
  silenceRatio?: number;
  burstCount?: number;
  dynamicRange?: number;
  zeroCrossingRateApprox?: number;
  envelopeVariance?: number;
  dominantEnergyTrend?: 'rising' | 'falling' | 'flat' | 'mixed';
}

export interface ContextFeatures {
  hourBucket: HourBucket;
  recentMeowCount: number;
  recentAttentionPattern: number;
  recentFoodPattern: number;
  personalityHints: string[];
  relationshipStage?: string;
}

export interface IntentScores {
  attention: number;
  food_like: number;
  playful: number;
  curious: number;
  unsettled: number;
  sleepy: number;
  unknown: number;
}

export interface LocalAnalysisResult {
  summaryText: string;
  catSubtitle: string;
  primaryIntent: IntentBucket;
  confidenceBand: ConfidenceBand;
  analysisMode: AnalysisMode;
  audioFeatures: AudioFeatures;
  intentScores: IntentScores;
}

export type LocalAnalysisContext = {
  language?: AppLanguage;
  profile?: CatProfileLike;
  personaState?: CatPersonaState;
  log?: LogEntryLike[];
  durationMs?: number;
};

export type EnrichedContextFeatures = ContextFeatures & {
  followsRepeatedCluster: boolean;
  conversationStreak: number;
  recentPrimaryIntents: IntentBucket[];
  repeatedSummaryHints: string[];
};
