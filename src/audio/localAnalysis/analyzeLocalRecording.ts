import {
  CLIP_QUALITY_RANK,
  LEGACY_CLIP_QUALITY_MAP,
  LOCAL_ANALYSIS_SAFE_RESULT,
} from './constants';
import { buildContextFeatures } from './contextFeatures';
import { extractLocalAudioFeatures } from './featureExtraction';
import { scoreIntents } from './intentScoring';
import { buildInterpretiveReply } from './replyGenerator';
import {
  ClipQuality,
  ClipQualityInput,
  LocalAnalysisContext,
  LocalAnalysisResult,
  ScoreBreakdown,
} from './types';

function normalizeClipQuality(clipQuality: ClipQualityInput): ClipQuality {
  if (clipQuality === 'clean' || clipQuality === 'noisy' || clipQuality === 'unusable') {
    return clipQuality;
  }
  return LEGACY_CLIP_QUALITY_MAP[clipQuality];
}

function pickLowerQuality(a: ClipQualityInput, b: ClipQuality): ClipQuality {
  const normalizedA = normalizeClipQuality(a);
  return CLIP_QUALITY_RANK[normalizedA] <= CLIP_QUALITY_RANK[b] ? normalizedA : b;
}

function buildPublicAnalysisMode(): LocalAnalysisResult['analysisMode'] {
  return 'local_heuristic';
}

function emptyBreakdown(): ScoreBreakdown {
  return {
    attention_like: { score: 0.11, reasons: [] },
    food_like: { score: 0.11, reasons: [] },
    playful: { score: 0.11, reasons: [] },
    curious: { score: 0.11, reasons: [] },
    unsettled: { score: 0.11, reasons: [] },
    sleepy: { score: 0.11, reasons: [] },
    unknown: { score: 0.34, reasons: ['fallback safe default'] },
  };
}

export async function analyzeLocalRecording(
  recordingUri: string | undefined,
  context: LocalAnalysisContext = {}
): Promise<LocalAnalysisResult> {
  const language = context.language ?? 'ja';

  try {
    const extracted = await extractLocalAudioFeatures(recordingUri, context.durationMs);
    const contextFeatures = buildContextFeatures(context);
    const clipQuality = context.clipQuality
      ? pickLowerQuality(context.clipQuality, extracted.derivedClipQuality)
      : extracted.derivedClipQuality;
    const scored = scoreIntents({
      features: extracted.features,
      context: contextFeatures,
      clipQuality,
      extractionSucceeded: extracted.extractionSucceeded,
      availableFeatureCount: extracted.availableFeatureCount,
    });
    const reply = buildInterpretiveReply({
      language,
      primaryIntent: scored.primaryIntent,
      confidenceBand: scored.confidenceBand,
    });

    return {
      primaryIntent: scored.primaryIntent,
      secondaryIntents: scored.secondaryIntents,
      confidenceBand: scored.confidenceBand,
      summaryText: reply.summaryText,
      catSubtitle: reply.catSubtitle,
      analysisMode: buildPublicAnalysisMode(),
      features: extracted.features,
      scoreBreakdown: scored.scoreBreakdown,
      reasons: [...extracted.reasons, ...scored.reasons].slice(0, 5),
    };
  } catch {
    return {
      primaryIntent: 'unknown',
      secondaryIntents: [],
      confidenceBand: 'low',
      summaryText:
        language === 'ja'
          ? LOCAL_ANALYSIS_SAFE_RESULT.summaryTextJa
          : LOCAL_ANALYSIS_SAFE_RESULT.summaryTextEn,
      catSubtitle:
        language === 'ja'
          ? LOCAL_ANALYSIS_SAFE_RESULT.subtitleJa
          : LOCAL_ANALYSIS_SAFE_RESULT.subtitleEn,
      analysisMode: buildPublicAnalysisMode(),
      features: {
        durationMs: Math.max(0, Math.round(context.durationMs ?? 0)),
        averageAmplitude: null,
        peakAmplitude: null,
        silenceRatio: null,
      },
      scoreBreakdown: emptyBreakdown(),
      reasons: ['local heuristic analysis failed safely'],
    };
  }
}
