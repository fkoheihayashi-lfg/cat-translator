import { IntentBucket, IntentScores } from './types';

export const INTENT_BUCKETS: IntentBucket[] = [
  'attention',
  'food_like',
  'playful',
  'curious',
  'unsettled',
  'sleepy',
  'unknown',
];

export const DEFAULT_INTENT_SCORES: IntentScores = {
  attention: 0.14,
  food_like: 0.14,
  playful: 0.14,
  curious: 0.14,
  unsettled: 0.14,
  sleepy: 0.14,
  unknown: 0.16,
};

export const REPEATED_CLUSTER_WINDOW_MS = 2 * 60 * 1000;

export const LOCAL_ANALYSIS_SAFE_RESULT = {
  summaryTextJa: '今は小さめの声かも。そばにいると落ち着きそう。',
  summaryTextEn: 'This sounds subtle right now. Staying nearby may help.',
  subtitleJa: 'みゅ…',
  subtitleEn: 'mrr...',
};
