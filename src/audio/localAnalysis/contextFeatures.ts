import { detectInteractionTheme } from '../../logic/catPersona';
import { getHourBucket } from '../../utils/timeBuckets';
import { ContextFeatures, IntentBucket, LocalAnalysisContext } from './types';

function mapMoodToIntent(mood: string): IntentBucket {
  if (mood === '甘え') return 'attention_like';
  if (mood === '要求') return 'food_like';
  if (mood === '興味') return 'curious';
  if (mood === '不満') return 'unsettled';
  if (mood === '安心') return 'sleepy';
  return 'unknown';
}

function countRecentIntent(log: NonNullable<LocalAnalysisContext['log']>, intent: IntentBucket): number {
  return log
    .filter((entry) => entry.direction === 'cat_to_human')
    .slice(-6)
    .filter((entry) => mapMoodToIntent(entry.mood) === intent).length;
}

export function buildContextFeatures(context: LocalAnalysisContext): ContextFeatures {
  const log = context.log ?? [];
  const recentCatLogCount = log.filter((entry) => entry.direction === 'cat_to_human').slice(-6).length;
  const recentFoodLikeCount = log
    .filter((entry) => entry.direction === 'cat_to_human')
    .slice(-6)
    .filter((entry) => detectInteractionTheme(entry) === 'food').length;
  const timeBucket = context.timeBucket ?? getHourBucket();
  const mealContext =
    context.mealContext ??
    (timeBucket === 'morning' || timeBucket === 'evening' ? 'meal_window' : 'not_food_time');

  const ownerContext =
    context.ownerContext ??
    (recentCatLogCount > 0 ? 'recent_interaction' : context.personaState?.relationshipStage === 'attached' ? 'nearby' : 'unknown');

  const environmentTrigger = context.environmentTrigger ?? 'unknown';
  const activityContext = context.activityContext ?? 'unknown';
  const locationContext = context.locationContext ?? 'unknown';

  const recentAttentionLikeCount = countRecentIntent(log, 'attention_like');
  const recentPlayfulCount = countRecentIntent(log, 'playful');
  const recentCuriousCount = countRecentIntent(log, 'curious');
  const recentUnsettledCount = countRecentIntent(log, 'unsettled');
  const recentSleepyCount = countRecentIntent(log, 'sleepy');

  const explicitContextCount = [
    context.mealContext,
    context.ownerContext,
    context.environmentTrigger,
    context.activityContext,
    context.locationContext,
  ].filter((value) => value && value !== 'unknown').length;

  return {
    timeBucket,
    mealContext,
    ownerContext,
    environmentTrigger,
    activityContext,
    locationContext,
    relationshipStage: context.personaState?.relationshipStage,
    recentCatLogCount,
    recentAttentionLikeCount,
    recentFoodLikeCount,
    recentPlayfulCount,
    recentCuriousCount,
    recentUnsettledCount,
    recentSleepyCount,
    hasStrongContext:
      explicitContextCount >= 2 ||
      recentAttentionLikeCount >= 2 ||
      recentFoodLikeCount >= 2 ||
      recentPlayfulCount >= 2,
  };
}
