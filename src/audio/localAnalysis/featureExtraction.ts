import * as FileSystem from 'expo-file-system/legacy';
import { createSeed } from '../../logic/catPersona';
import { clamp01, safeDiv } from '../../utils/normalization';
import { AudioFeatures } from './types';

export type LocalFeatureExtractionResult = {
  features: AudioFeatures;
  hasUsableSignal: boolean;
};

function trendFromSeed(seed: number): AudioFeatures['dominantEnergyTrend'] {
  const trendIndex = Math.abs(seed) % 4;
  if (trendIndex === 0) return 'rising';
  if (trendIndex === 1) return 'falling';
  if (trendIndex === 2) return 'flat';
  return 'mixed';
}

export async function extractLocalAudioFeatures(
  recordingUri: string | undefined,
  durationMs?: number
): Promise<LocalFeatureExtractionResult> {
  const safeDurationMs = Math.max(0, Math.round(durationMs ?? 0));

  if (!recordingUri || safeDurationMs <= 0) {
    return {
      features: { durationMs: safeDurationMs },
      hasUsableSignal: false,
    };
  }

  try {
    const info = await FileSystem.getInfoAsync(recordingUri);
    const byteSize = info.exists && typeof info.size === 'number' ? info.size : 0;
    // We do not decode waveform samples here. These are lightweight on-device heuristics
    // derived from stable local file properties so the app stays offline and replaceable.
    const seed = createSeed(recordingUri, safeDurationMs, byteSize);

    const seconds = safeDurationMs / 1000;
    const kbPerSecond = safeDiv(byteSize / 1024, seconds, 12);
    const durationFactor = clamp01(safeDurationMs / 5500);
    const density = clamp01((kbPerSecond - 6) / 38);
    const seedJitter = (Math.abs(seed % 1000) / 1000) * 0.08;

    const rmsMean = clamp01(0.2 + density * 0.6 + durationFactor * 0.1 + seedJitter);
    const rmsPeak = clamp01(rmsMean + 0.18 + (Math.abs(seed % 17) / 100) * 0.18);
    const silenceRatio = clamp01(0.72 - rmsMean * 0.55 + (Math.abs(seed % 9) / 100));
    const burstCount = Math.max(
      0,
      Math.round(seconds * (0.7 + rmsPeak * 1.1 + (1 - silenceRatio) * 0.8))
    );
    const dynamicRange = clamp01(rmsPeak - rmsMean + (Math.abs(seed % 7) / 100));
    const zeroCrossingRateApprox = clamp01(
      0.16 + density * 0.38 + safeDiv(burstCount, Math.max(1, seconds * 8), 0) * 0.35
    );
    const envelopeVariance = clamp01(
      0.12 + dynamicRange * 0.65 + safeDiv(burstCount, Math.max(1, seconds * 5), 0) * 0.2
    );

    return {
      features: {
        durationMs: safeDurationMs,
        rmsMean,
        rmsPeak,
        silenceRatio,
        burstCount,
        dynamicRange,
        zeroCrossingRateApprox,
        envelopeVariance,
        dominantEnergyTrend: trendFromSeed(seed),
      },
      hasUsableSignal: true,
    };
  } catch {
    return {
      features: { durationMs: safeDurationMs },
      hasUsableSignal: false,
    };
  }
}
