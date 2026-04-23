import { ClipQuality, IntentBucket, IntentScores, LegacyClipQuality } from './types';

export const INTENT_BUCKETS: IntentBucket[] = [
  'attention_like',
  'food_like',
  'playful',
  'curious',
  'unsettled',
  'sleepy',
  'unknown',
];

export const DEFAULT_INTENT_SCORES: IntentScores = {
  attention_like: 0.08,
  food_like: 0.08,
  playful: 0.08,
  curious: 0.08,
  unsettled: 0.08,
  sleepy: 0.08,
  unknown: 0.16,
};

export const MIN_RELIABLE_DURATION_MS = 350;
export const HIGH_SILENCE_RATIO_THRESHOLD = 0.88;
export const WEAK_TOP_SCORE_THRESHOLD = 0.26;
export const CLOSE_SCORE_GAP_THRESHOLD = 0.06;

export const CLIP_QUALITY_RANK: Record<ClipQuality, number> = {
  unusable: 0,
  noisy: 1,
  clean: 2,
};

export const LEGACY_CLIP_QUALITY_MAP: Record<LegacyClipQuality, ClipQuality> = {
  unusable: 'unusable',
  poor: 'noisy',
  fair: 'noisy',
  good: 'clean',
};

export const LOCAL_ANALYSIS_SAFE_RESULT = {
  summaryTextJa: 'はっきりとは読み切れませんが、小さな呼びかけに聞こえるかもしれません。',
  summaryTextEn: 'This is hard to read clearly, but it might be a small call.',
  subtitleJa: 'みゅ…',
  subtitleEn: 'mrr...',
};
