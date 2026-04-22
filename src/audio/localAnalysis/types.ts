import { AppLanguage } from '../../i18n/strings';
import {
  CatPersonaState,
  CatProfileLike,
  LogEntryLike,
  RelationshipStage,
} from '../../logic/catPersona';
import { HourBucket } from '../../utils/timeBuckets';

export type IntentBucket =
  | 'attention_like'
  | 'food_like'
  | 'playful'
  | 'curious'
  | 'unsettled'
  | 'sleepy'
  | 'unknown';

export type ConfidenceBand = 'low' | 'medium' | 'high';
export type AnalysisMode = 'local_heuristic';
export type ClipQuality = 'clean' | 'noisy' | 'unusable';
export type LegacyClipQuality = 'good' | 'fair' | 'poor' | 'unusable';
export type ClipQualityInput = ClipQuality | LegacyClipQuality;

export type MealContext = 'meal_window' | 'after_meal' | 'not_food_time' | 'unknown';
export type OwnerContext =
  | 'nearby'
  | 'recent_interaction'
  | 'recently_left'
  | 'recently_returned'
  | 'sleeping'
  | 'unknown';
export type EnvironmentTrigger =
  | 'food_prep'
  | 'toy'
  | 'door'
  | 'outside_noise'
  | 'sudden_noise'
  | 'none'
  | 'unknown';
export type ActivityContext =
  | 'resting'
  | 'settling'
  | 'playing'
  | 'exploring'
  | 'waiting'
  | 'unknown';
export type LocationContext =
  | 'food_area'
  | 'doorway'
  | 'window'
  | 'bed'
  | 'shared_space'
  | 'unknown';

export interface AudioFeatures {
  durationMs: number;
  averageAmplitude: number | null;
  peakAmplitude: number | null;
  silenceRatio: number | null;
}

export interface ContextFeatures {
  timeBucket: HourBucket;
  mealContext: MealContext;
  ownerContext: OwnerContext;
  environmentTrigger: EnvironmentTrigger;
  activityContext: ActivityContext;
  locationContext: LocationContext;
  relationshipStage?: RelationshipStage;
  recentCatLogCount: number;
  recentAttentionLikeCount: number;
  recentFoodLikeCount: number;
  recentPlayfulCount: number;
  recentCuriousCount: number;
  recentUnsettledCount: number;
  recentSleepyCount: number;
  hasStrongContext: boolean;
}

export interface IntentScoreDetail {
  score: number;
  reasons: string[];
}

export type ScoreBreakdown = Record<IntentBucket, IntentScoreDetail>;
export type IntentScores = Record<IntentBucket, number>;

export interface LocalAnalysisResult {
  primaryIntent: IntentBucket;
  secondaryIntents: IntentBucket[];
  confidenceBand: ConfidenceBand;
  summaryText: string;
  catSubtitle: string;
  analysisMode: AnalysisMode;
  features: AudioFeatures;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
}

export type LocalAnalysisContext = {
  language?: AppLanguage;
  profile?: CatProfileLike;
  personaState?: CatPersonaState;
  log?: LogEntryLike[];
  durationMs?: number;
  clipQuality?: ClipQualityInput;
  timeBucket?: HourBucket;
  mealContext?: MealContext;
  ownerContext?: OwnerContext;
  environmentTrigger?: EnvironmentTrigger;
  activityContext?: ActivityContext;
  locationContext?: LocationContext;
};
