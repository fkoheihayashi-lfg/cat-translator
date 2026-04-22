import * as FileSystem from 'expo-file-system/legacy';
import { createSeed } from '../../logic/catPersona';
import { clamp01, safeDiv } from '../../utils/normalization';
import {
  AudioFeatures,
  ClipQuality,
} from './types';

export type LocalFeatureExtractionResult = {
  features: AudioFeatures;
  extractionSucceeded: boolean;
  derivedClipQuality: ClipQuality;
  availableFeatureCount: number;
  reasons: string[];
};

function buildEmptyFeatures(durationMs: number): AudioFeatures {
  return {
    durationMs,
    averageAmplitude: null,
    peakAmplitude: null,
    silenceRatio: null,
  };
}

function countAvailableFeatures(features: AudioFeatures): number {
  return [features.averageAmplitude, features.peakAmplitude, features.silenceRatio].filter(
    (value) => value !== null
  ).length;
}

function estimateEstimatedClipQuality(
  durationMs: number,
  silenceRatio: number | null,
  availableFeatureCount: number
): ClipQuality {
  if (durationMs < 250) return 'unusable';
  if (silenceRatio !== null && silenceRatio >= 0.94) return 'unusable';
  if (availableFeatureCount < 2) return 'noisy';
  if (durationMs < 1400) return 'noisy';
  if (silenceRatio !== null && silenceRatio >= 0.74) return 'noisy';
  return 'clean';
}

export async function extractLocalAudioFeatures(
  recordingUri: string | undefined,
  durationMs?: number
): Promise<LocalFeatureExtractionResult> {
  const safeDurationMs = Math.max(0, Math.round(durationMs ?? 0));

  if (!recordingUri) {
    return {
      features: buildEmptyFeatures(safeDurationMs),
      extractionSucceeded: false,
      derivedClipQuality: 'unusable',
      availableFeatureCount: 0,
      reasons: ['recording uri missing'],
    };
  }

  if (safeDurationMs <= 0) {
    return {
      features: buildEmptyFeatures(safeDurationMs),
      extractionSucceeded: false,
      derivedClipQuality: 'unusable',
      availableFeatureCount: 0,
      reasons: ['recording duration missing'],
    };
  }

  try {
    const info = await FileSystem.getInfoAsync(recordingUri);
    const byteSize = info.exists && typeof info.size === 'number' ? info.size : 0;

    if (byteSize <= 0) {
      return {
        features: buildEmptyFeatures(safeDurationMs),
        extractionSucceeded: false,
        derivedClipQuality: 'unusable',
        availableFeatureCount: 0,
        reasons: ['recording metadata unavailable'],
      };
    }

    const seconds = Math.max(0.1, safeDurationMs / 1000);
    // Phase 1 stays fully local and does not decode waveform samples here.
    // These values are metadata-derived proxies, not true acoustic measurements.
    const bytesPerSecondEstimate = safeDiv(byteSize, seconds, 0);
    const densityEstimate = clamp01((bytesPerSecondEstimate - 2400) / 28000);
    const durationFactor = clamp01(safeDurationMs / 3200);
    const seed = createSeed(recordingUri, safeDurationMs, byteSize);
    const jitterA = (Math.abs(seed % 100) / 100) * 0.06;
    const jitterB = (Math.abs(seed % 71) / 100) * 0.05;

    const averageAmplitude = clamp01(
      0.16 + densityEstimate * 0.48 + durationFactor * 0.08 + jitterA
    );
    const peakAmplitude = clamp01(averageAmplitude + 0.14 + jitterB);
    const silenceRatio = clamp01(0.84 - averageAmplitude * 0.5 + (1 - durationFactor) * 0.08);

    const features: AudioFeatures = {
      durationMs: safeDurationMs,
      averageAmplitude,
      peakAmplitude,
      silenceRatio,
    };
    const availableFeatureCount = countAvailableFeatures(features);

    return {
      features,
      extractionSucceeded: true,
      derivedClipQuality: estimateEstimatedClipQuality(
        safeDurationMs,
        silenceRatio,
        availableFeatureCount
      ),
      availableFeatureCount,
      reasons: ['features estimated locally from recording metadata'],
    };
  } catch {
    return {
      features: buildEmptyFeatures(safeDurationMs),
      extractionSucceeded: false,
      derivedClipQuality: 'unusable',
      availableFeatureCount: 0,
      reasons: ['feature extraction failed'],
    };
  }
}
