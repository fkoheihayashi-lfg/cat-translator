import { LOCAL_ANALYSIS_SAFE_RESULT } from './constants';
import { buildContextFeatures } from './contextFeatures';
import { extractLocalAudioFeatures } from './featureExtraction';
import { scoreIntents, toConfidenceBand } from './intentScoring';
import { buildInterpretiveReply } from './replyGenerator';
import {
  AnalysisMode,
  IntentScores,
  LocalAnalysisContext,
  LocalAnalysisResult,
} from './types';

function fallbackScores(): IntentScores {
  return {
    attention: 0.12,
    food_like: 0.12,
    playful: 0.12,
    curious: 0.12,
    unsettled: 0.12,
    sleepy: 0.16,
    unknown: 0.24,
  };
}

export async function analyzeLocalRecording(
  recordingUri: string | undefined,
  context: LocalAnalysisContext = {}
): Promise<LocalAnalysisResult> {
  const language = context.language ?? 'ja';

  try {
    const audioExtraction = await extractLocalAudioFeatures(recordingUri, context.durationMs);
    const contextFeatures = buildContextFeatures(context);
    const scored = scoreIntents(
      audioExtraction.features,
      contextFeatures,
      audioExtraction.hasUsableSignal
    );
    const confidenceBand = toConfidenceBand(scored.intentScores);
    const analysisMode: AnalysisMode = audioExtraction.hasUsableSignal
      ? 'local_audio_heuristic'
      : 'local_context_fallback';

    const reply = buildInterpretiveReply({
      primaryIntent: scored.primaryIntent,
      intentScores: scored.intentScores,
      confidenceBand,
      analysisMode,
      contextFeatures,
      context,
    });

    return {
      summaryText: reply.summaryText,
      catSubtitle: reply.catSubtitle,
      primaryIntent: scored.primaryIntent,
      confidenceBand,
      analysisMode,
      audioFeatures: audioExtraction.features,
      intentScores: scored.intentScores,
    };
  } catch {
    return {
      summaryText:
        language === 'ja'
          ? LOCAL_ANALYSIS_SAFE_RESULT.summaryTextJa
          : LOCAL_ANALYSIS_SAFE_RESULT.summaryTextEn,
      catSubtitle:
        language === 'ja'
          ? LOCAL_ANALYSIS_SAFE_RESULT.subtitleJa
          : LOCAL_ANALYSIS_SAFE_RESULT.subtitleEn,
      primaryIntent: 'unknown',
      confidenceBand: 'low',
      analysisMode: 'local_context_fallback',
      audioFeatures: {
        durationMs: Math.max(0, Math.round(context.durationMs ?? 0)),
      },
      intentScores: fallbackScores(),
    };
  }
}
