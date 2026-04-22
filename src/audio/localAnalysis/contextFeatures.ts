import { detectInteractionTheme } from '../../logic/catPersona';
import { clamp01 } from '../../utils/normalization';
import { getHourBucket } from '../../utils/timeBuckets';
import { REPEATED_CLUSTER_WINDOW_MS } from './constants';
import { EnrichedContextFeatures, IntentBucket, LocalAnalysisContext } from './types';

function mapMoodToIntent(mood: string): IntentBucket {
  if (mood === '甘え') return 'attention';
  if (mood === '要求') return 'food_like';
  if (mood === '興味') return 'curious';
  if (mood === '不満') return 'unsettled';
  if (mood === '安心') return 'sleepy';
  return 'unknown';
}

function getConversationStreak(logCount: number): number {
  if (logCount >= 45) return 4;
  if (logCount >= 24) return 3;
  if (logCount >= 10) return 2;
  if (logCount >= 4) return 1;
  return 0;
}

export function buildContextFeatures(context: LocalAnalysisContext): EnrichedContextFeatures {
  const log = context.log ?? [];
  const catLogs = log.filter((entry) => entry.direction === 'cat_to_human');
  const latestCat = catLogs[catLogs.length - 1];
  const prevCat = catLogs[catLogs.length - 2];
  const recentWindow = catLogs.slice(-8);
  const recentMeowCount = recentWindow.length;

  const attentionMatches = recentWindow.filter((entry) => {
    const theme = detectInteractionTheme(entry);
    return theme === 'affection' || theme === 'comfort';
  }).length;
  const foodMatches = recentWindow.filter((entry) => detectInteractionTheme(entry) === 'food').length;

  const hourBucket = getHourBucket();
  const personalityHints = [
    context.profile?.personality ?? 'steady',
    context.personaState?.personalityTone ?? 'steady',
    context.personaState?.dominantTheme ?? 'general',
  ];

  const followsRepeatedCluster =
    !!latestCat &&
    !!prevCat &&
    latestCat.createdAt - prevCat.createdAt <= REPEATED_CLUSTER_WINDOW_MS;

  const repeatedSummaryHints = catLogs
    .slice(-8)
    .map((entry) => entry.translatedText)
    .filter((line, index, arr) => arr.indexOf(line) !== index)
    .slice(0, 4);

  return {
    hourBucket,
    recentMeowCount,
    recentAttentionPattern: clamp01(attentionMatches / Math.max(1, recentWindow.length)),
    recentFoodPattern: clamp01(foodMatches / Math.max(1, recentWindow.length)),
    personalityHints,
    relationshipStage: context.personaState?.relationshipStage,
    followsRepeatedCluster,
    conversationStreak: getConversationStreak(log.length),
    recentPrimaryIntents: recentWindow.map((entry) => mapMoodToIntent(entry.mood)).slice(-4),
    repeatedSummaryHints,
  };
}
