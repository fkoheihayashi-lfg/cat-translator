import { clamp01, normalizeScores } from '../../utils/normalization';
import {
  CLOSE_SCORE_GAP_THRESHOLD,
  DEFAULT_INTENT_SCORES,
  HIGH_SILENCE_RATIO_THRESHOLD,
  MIN_RELIABLE_DURATION_MS,
  WEAK_TOP_SCORE_THRESHOLD,
} from './constants';
import {
  AudioFeatures,
  ClipQuality,
  ConfidenceBand,
  ContextFeatures,
  IntentBucket,
  IntentScoreDetail,
  ScoreBreakdown,
} from './types';

type ScoreIntentsInput = {
  features: AudioFeatures;
  context: ContextFeatures;
  clipQuality: ClipQuality;
  extractionSucceeded: boolean;
  availableFeatureCount: number;
};

type ScoredCandidate = {
  intent: IntentBucket;
  score: number;
};

export type IntentScoringResult = {
  primaryIntent: IntentBucket;
  secondaryIntents: IntentBucket[];
  confidenceBand: ConfidenceBand;
  scoreBreakdown: ScoreBreakdown;
  reasons: string[];
};

function createBreakdown(): ScoreBreakdown {
  return {
    attention_like: { score: DEFAULT_INTENT_SCORES.attention_like, reasons: [] },
    food_like: { score: DEFAULT_INTENT_SCORES.food_like, reasons: [] },
    playful: { score: DEFAULT_INTENT_SCORES.playful, reasons: [] },
    curious: { score: DEFAULT_INTENT_SCORES.curious, reasons: [] },
    unsettled: { score: DEFAULT_INTENT_SCORES.unsettled, reasons: [] },
    sleepy: { score: DEFAULT_INTENT_SCORES.sleepy, reasons: [] },
    unknown: { score: DEFAULT_INTENT_SCORES.unknown, reasons: [] },
  };
}

function bump(
  breakdown: ScoreBreakdown,
  intent: IntentBucket,
  amount: number,
  reason: string
): void {
  breakdown[intent].score += amount;
  breakdown[intent].reasons.push(reason);
}

function rankedCandidates(scoreBreakdown: ScoreBreakdown): ScoredCandidate[] {
  return (Object.entries(scoreBreakdown) as Array<[IntentBucket, IntentScoreDetail]>)
    .map(([intent, detail]) => ({ intent, score: detail.score }))
    .sort((a, b) => b.score - a.score);
}

function normalizeBreakdown(scoreBreakdown: ScoreBreakdown): ScoreBreakdown {
  const normalizedScores = normalizeScores(
    (Object.keys(scoreBreakdown) as IntentBucket[]).reduce<Record<IntentBucket, number>>(
      (acc, intent) => {
        acc[intent] = scoreBreakdown[intent].score;
        return acc;
      },
      {} as Record<IntentBucket, number>
    )
  );

  return (Object.keys(scoreBreakdown) as IntentBucket[]).reduce<ScoreBreakdown>((acc, intent) => {
    acc[intent] = {
      score: normalizedScores[intent],
      reasons: scoreBreakdown[intent].reasons,
    };
    return acc;
  }, createBreakdown());
}

function toConfidenceBand(
  primaryIntent: IntentBucket,
  topScore: number,
  gap: number,
  clipQuality: ClipQuality,
  availableFeatureCount: number,
  strongFeatureReasonCount: number,
  genericReasonCount: number
): ConfidenceBand {
  if (primaryIntent === 'unknown') return 'low';
  if (clipQuality === 'noisy' && gap < 0.12) return 'low';
  if (strongFeatureReasonCount === 0 || genericReasonCount > strongFeatureReasonCount + 1) {
    if (topScore >= 0.4 && gap >= 0.12 && clipQuality === 'clean' && availableFeatureCount >= 3) {
      return 'medium';
    }
    return 'low';
  }
  if (topScore >= 0.42 && gap >= 0.14 && clipQuality === 'clean' && availableFeatureCount >= 3) {
    return 'high';
  }
  if (topScore >= 0.31 && gap >= 0.08 && clipQuality !== 'unusable' && availableFeatureCount >= 2) {
    return 'medium';
  }
  return 'low';
}

function isGenericReason(reason: string): boolean {
  return (
    reason.includes('context') ||
    reason.includes('history') ||
    reason.includes('location') ||
    reason.includes('meal') ||
    reason.includes('late-hour')
  );
}

function hasNoiseDisturbanceContext(context: ContextFeatures): boolean {
  return String(context.environmentTrigger) === 'after_noise';
}

function applyFeatureHeuristics(
  breakdown: ScoreBreakdown,
  features: AudioFeatures,
  context: ContextFeatures
): void {
  const durationMs = features.durationMs;
  const averageAmplitude = features.averageAmplitude ?? 0;
  const peakAmplitude = features.peakAmplitude ?? 0;
  const silenceRatio = features.silenceRatio ?? 0.5;

  if (durationMs >= 400 && durationMs <= 2600) {
    bump(breakdown, 'attention_like', 0.08, 'short to medium call length');
    bump(breakdown, 'food_like', 0.03, 'brief request-like duration');
    bump(breakdown, 'curious', 0.06, 'short exploratory clip');
  }

  if (averageAmplitude >= 0.2 && averageAmplitude <= 0.58) {
    bump(breakdown, 'attention_like', 0.06, 'moderate average amplitude');
  }

  if (averageAmplitude >= 0.42) {
    bump(breakdown, 'playful', 0.08, 'livelier average amplitude');
    bump(breakdown, 'unsettled', 0.06, 'raised overall intensity');
  }

  if (averageAmplitude <= 0.3) {
    bump(breakdown, 'sleepy', 0.08, 'soft average amplitude');
  }

  if (peakAmplitude >= 0.48) {
    bump(breakdown, 'food_like', 0.02, 'clear peak moments');
  }

  if (peakAmplitude >= 0.6) {
    bump(breakdown, 'playful', 0.08, 'sharper local peaks');
  }

  if (peakAmplitude >= 0.68) {
    bump(breakdown, 'unsettled', 0.16, 'more abrupt peak energy');
  }

  if (silenceRatio >= 0.45 && silenceRatio <= 0.82) {
    bump(breakdown, 'curious', 0.06, 'pauses suggest intermittent interest');
  }

  if (silenceRatio >= 0.72) {
    bump(breakdown, 'sleepy', 0.1, 'more silence than sustained vocalizing');
  }

  if (silenceRatio <= 0.28) {
    bump(breakdown, 'unsettled', 0.12, 'little silence across the clip');
  }

  if (context.timeBucket === 'night') {
    bump(breakdown, 'sleepy', 0.09, 'late-hour context');
  }

  if (context.mealContext === 'meal_window') {
    bump(breakdown, 'food_like', 0.13, 'meal-time context');
  }

  if (context.mealContext === 'after_meal') {
    bump(breakdown, 'food_like', 0.02, 'food may still be on their mind');
  }

  if (context.ownerContext === 'nearby' || context.ownerContext === 'recent_interaction') {
    bump(breakdown, 'attention_like', 0.14, 'owner-presence context');
  }

  if (context.ownerContext === 'recently_returned') {
    bump(breakdown, 'attention_like', 0.18, 'owner just came back');
  }

  if (context.ownerContext === 'recently_left') {
    bump(breakdown, 'unsettled', 0.1, 'owner may have just left');
  }

  if (context.activityContext === 'playing') {
    bump(breakdown, 'playful', 0.2, 'already in an active play context');
  }

  if (context.activityContext === 'exploring') {
    bump(breakdown, 'curious', 0.18, 'active exploration context');
  }

  if (context.activityContext === 'resting' || context.activityContext === 'settling') {
    bump(breakdown, 'sleepy', 0.08, 'rest-oriented activity context');
  }

  if (context.activityContext === 'waiting') {
    bump(breakdown, 'attention_like', 0.06, 'waiting behavior can sound request-like');
  }

  if (context.locationContext === 'food_area') {
    bump(breakdown, 'food_like', 0.08, 'food-area location context');
  }

  if (context.locationContext === 'window' || context.locationContext === 'doorway') {
    bump(breakdown, 'curious', 0.1, 'watchful location context');
  }

  if (context.locationContext === 'bed') {
    bump(breakdown, 'sleepy', 0.07, 'resting-place location context');
  }

  if (context.locationContext === 'shared_space') {
    bump(breakdown, 'attention_like', 0.06, 'shared-space closeness context');
  }

  if (
    hasNoiseDisturbanceContext(context) &&
    (
      context.locationContext === 'bed' ||
      String(context.locationContext) === 'sofa' ||
      context.activityContext === 'resting' ||
      context.activityContext === 'settling'
    )
  ) {
    bump(breakdown, 'unsettled', 0.18, 'recent noise disturbance');
    bump(breakdown, 'sleepy', -0.04, 'noise disturbance tempers rest-context sleepy read');
  }

  if (context.recentAttentionLikeCount >= 2) {
    bump(breakdown, 'attention_like', 0.12, 'recent history leans attention-like');
  }

  if (context.recentFoodLikeCount >= 2) {
    bump(breakdown, 'food_like', 0.05, 'recent history leans food-like');
  }

  if (context.recentPlayfulCount >= 1) {
    bump(breakdown, 'playful', 0.07, 'recent history leans playful');
  }

  if (context.recentCuriousCount >= 1) {
    bump(breakdown, 'curious', 0.05, 'recent history leans curious');
  }

  if (context.recentUnsettledCount >= 1) {
    bump(breakdown, 'unsettled', 0.06, 'recent history leans unsettled');
  }

  if (context.recentSleepyCount >= 2) {
    bump(breakdown, 'sleepy', 0.05, 'recent history leans sleepy');
  }
}

export function scoreIntents(input: ScoreIntentsInput): IntentScoringResult {
  const breakdown = createBreakdown();
  const reasons: string[] = [];

  applyFeatureHeuristics(breakdown, input.features, input.context);

  if (!input.extractionSucceeded) {
    bump(breakdown, 'unknown', 0.34, 'feature extraction did not complete cleanly');
  }

  if (input.availableFeatureCount < 2) {
    bump(breakdown, 'unknown', 0.18, 'too few usable local features');
  }

  if (input.clipQuality === 'noisy') {
    bump(breakdown, 'unknown', 0.14, 'clip quality looks limited');
    bump(breakdown, 'sleepy', -0.05, 'noisy audio rarely fits a sleepy read');
  }

  if (input.clipQuality === 'unusable') {
    bump(breakdown, 'unknown', 0.4, 'clip quality is unusable');
  }

  const normalizedBreakdown = normalizeBreakdown(breakdown);
  const ranked = rankedCandidates(normalizedBreakdown);
  const top = ranked[0] ?? { intent: 'unknown' as IntentBucket, score: 0 };
  const second = ranked[1] ?? { intent: 'unknown' as IntentBucket, score: 0 };
  const scoreGap = top.score - second.score;
  const topReasons = normalizedBreakdown[top.intent].reasons;
  const secondReasons = normalizedBreakdown[second.intent]?.reasons ?? [];
  const topGenericReasonCount = topReasons.filter(isGenericReason).length;
  const topStrongFeatureReasonCount = topReasons.length - topGenericReasonCount;

  let primaryIntent = top.intent;

  if (input.clipQuality === 'unusable') {
    primaryIntent = 'unknown';
    reasons.push('clip quality was unusable');
  }

  if (!input.extractionSucceeded) {
    primaryIntent = 'unknown';
    reasons.push('feature extraction failed');
  }

  if (input.features.durationMs < MIN_RELIABLE_DURATION_MS) {
    primaryIntent = 'unknown';
    reasons.push('clip was too short for a reliable local read');
  }

  if (
    input.features.silenceRatio !== null &&
    input.features.silenceRatio >= HIGH_SILENCE_RATIO_THRESHOLD
  ) {
    primaryIntent = 'unknown';
    reasons.push('clip was mostly silence');
  }

  if (top.score < WEAK_TOP_SCORE_THRESHOLD) {
    primaryIntent = 'unknown';
    reasons.push('top intent score stayed weak');
  }

  if (scoreGap < CLOSE_SCORE_GAP_THRESHOLD && !input.context.hasStrongContext) {
    primaryIntent = 'unknown';
    reasons.push('top candidates were too close without strong context');
  }

  if (
    primaryIntent !== 'unknown' &&
    scoreGap < 0.1 &&
    topGenericReasonCount > topStrongFeatureReasonCount &&
    secondReasons.length >= topReasons.length
  ) {
    primaryIntent = 'unknown';
    reasons.push('weak generic context outweighed clearer signal');
  }

  const confidenceBand = toConfidenceBand(
    primaryIntent,
    top.score,
    clamp01(scoreGap),
    input.clipQuality,
    input.availableFeatureCount,
    topStrongFeatureReasonCount,
    topGenericReasonCount
  );

  const secondaryIntents = ranked
    .filter((candidate) => candidate.intent !== primaryIntent && candidate.intent !== 'unknown')
    .slice(0, 2)
    .map((candidate) => candidate.intent);

  if (primaryIntent !== 'unknown') {
    reasons.push(
      ...normalizedBreakdown[primaryIntent].reasons.slice(0, 3)
    );
  }

  return {
    primaryIntent,
    secondaryIntents,
    confidenceBand,
    scoreBreakdown: normalizedBreakdown,
    reasons: reasons.slice(0, 4),
  };
}
