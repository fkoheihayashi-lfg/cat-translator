import { clamp01, normalizeScores } from '../../utils/normalization';
import { DEFAULT_INTENT_SCORES } from './constants';
import { AudioFeatures, ConfidenceBand, EnrichedContextFeatures, IntentBucket, IntentScores } from './types';

function dominantIntent(intentScores: IntentScores): { primaryIntent: IntentBucket; topScore: number; secondScore: number } {
  const sorted = (Object.entries(intentScores) as Array<[IntentBucket, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  const primary = sorted[0] ?? ['unknown', 0];
  const second = sorted[1] ?? ['unknown', 0];
  return {
    primaryIntent: primary[0],
    topScore: primary[1],
    secondScore: second[1],
  };
}

export function toConfidenceBand(scores: IntentScores): ConfidenceBand {
  const { topScore, secondScore } = dominantIntent(scores);
  const spread = topScore - secondScore;
  if (topScore >= 0.43 && spread >= 0.18) return 'high';
  if (topScore >= 0.32 && spread >= 0.1) return 'medium';
  return 'low';
}

export function scoreIntents(
  audio: AudioFeatures,
  context: EnrichedContextFeatures,
  hasUsableSignal: boolean
): { intentScores: IntentScores; primaryIntent: IntentBucket } {
  const scores: IntentScores = { ...DEFAULT_INTENT_SCORES };

  const durationSec = audio.durationMs / 1000;
  const rmsMean = audio.rmsMean ?? 0;
  const rmsPeak = audio.rmsPeak ?? 0;
  const silence = audio.silenceRatio ?? 0.5;
  const burstCount = audio.burstCount ?? 0;
  const dynamicRange = audio.dynamicRange ?? 0;
  const zcr = audio.zeroCrossingRateApprox ?? 0;
  const envelopeVariance = audio.envelopeVariance ?? 0;

  scores.attention += context.recentAttentionPattern * 0.32;
  scores.attention += context.followsRepeatedCluster ? 0.16 : 0;
  scores.attention += burstCount >= 3 && durationSec < 3.5 ? 0.12 : 0;

  scores.food_like += context.recentFoodPattern * 0.46;
  scores.food_like += context.hourBucket === 'morning' || context.hourBucket === 'evening' ? 0.09 : 0;
  scores.food_like += burstCount >= 4 ? 0.08 : 0;

  scores.playful += burstCount >= 5 ? 0.22 : 0;
  scores.playful += zcr >= 0.42 ? 0.18 : 0;
  scores.playful += envelopeVariance >= 0.5 ? 0.16 : 0;

  scores.curious += durationSec >= 1.2 && durationSec <= 4.2 ? 0.16 : 0;
  scores.curious += audio.dominantEnergyTrend === 'mixed' ? 0.18 : 0;
  scores.curious += zcr >= 0.3 && zcr < 0.58 ? 0.14 : 0;

  scores.unsettled += rmsPeak >= 0.68 ? 0.2 : 0;
  scores.unsettled += dynamicRange >= 0.34 ? 0.16 : 0;
  scores.unsettled += silence <= 0.3 ? 0.08 : 0;

  scores.sleepy += context.hourBucket === 'night' ? 0.16 : 0;
  scores.sleepy += silence >= 0.58 ? 0.2 : 0;
  scores.sleepy += rmsMean <= 0.38 ? 0.12 : 0;
  scores.sleepy += audio.dominantEnergyTrend === 'falling' ? 0.12 : 0;

  if (!hasUsableSignal || durationSec <= 0.25) {
    scores.unknown += 0.38;
  } else {
    scores.unknown += clamp01(0.22 - (rmsMean + dynamicRange) * 0.2);
  }

  if (context.conversationStreak >= 3 && context.hourBucket === 'night') {
    scores.sleepy += 0.06;
  }

  const normalized = normalizeScores(scores);
  const dominant = dominantIntent(normalized);
  const primaryIntent =
    dominant.topScore < 0.26 || dominant.topScore - dominant.secondScore < 0.04
      ? 'unknown'
      : dominant.primaryIntent;

  return {
    intentScores: normalized,
    primaryIntent,
  };
}
