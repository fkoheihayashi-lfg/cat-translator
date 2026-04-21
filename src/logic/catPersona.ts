export type InteractionTheme =
  | 'affection'
  | 'food'
  | 'play'
  | 'rest'
  | 'comfort'
  | 'discipline'
  | 'curiosity'
  | 'general';

export type RelationshipStage = 'new' | 'warming' | 'bonded' | 'attached';

export type PersonaStyle = 'clingy' | 'steady' | 'reserved' | 'playful';

export type CatProfileLike = {
  name: string;
  personality: string;
};

export type LogEntryLike = {
  direction: 'cat_to_human' | 'human_to_cat';
  rawText: string;
  translatedText: string;
  soundKey: string;
  mood: string;
  createdAt: number;
  inputMode: 'recording' | 'text';
};

export type CatPersonaState = {
  interactionCount: number;
  relationshipStage: RelationshipStage;
  bondLabel: string;
  bondHint: string;
  personalityTone: PersonaStyle;
  dominantTheme: InteractionTheme;
  dominantRecentThemes: InteractionTheme[];
  favoriteTopic: InteractionTheme | '';
  recentThemes: InteractionTheme[];
  topicCounts: Record<InteractionTheme, number>;
  recentMoodTrend: string;
  recentDirectionTrend: 'balanced' | 'human_led' | 'cat_led';
  affectionCount: number;
  foodCount: number;
  playCount: number;
  restCount: number;
  comfortCount: number;
  latestInteractionAt: number | null;
  recentThemeSummary: string;
  memoryHint: string;
  communicationHint: string;
};

const TOPIC_LABEL: Record<InteractionTheme, string> = {
  affection: '甘え',
  food: 'ごはん',
  play: '遊び',
  rest: '休憩',
  comfort: 'そば',
  discipline: '不満',
  curiosity: '興味',
  general: 'ふだん',
};

const RELATIONSHIP_LABEL: Record<RelationshipStage, string> = {
  new: '様子見',
  warming: '少し慣れた',
  bonded: 'かなり親しい',
  attached: 'すっかり甘え気味',
};

function createEmptyTopicCounts(): Record<InteractionTheme, number> {
  return {
    affection: 0,
    food: 0,
    play: 0,
    rest: 0,
    comfort: 0,
    discipline: 0,
    curiosity: 0,
    general: 0,
  };
}

export function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function createSeed(...parts: Array<string | number>): number {
  return hashString(parts.join(':'));
}

export function pickBySeed<T>(items: T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

export function getTopicLabel(theme: InteractionTheme): string {
  return TOPIC_LABEL[theme];
}

export function getPersonalityTone(personality: string): PersonaStyle {
  if (personality === '甘えん坊') return 'clingy';
  if (personality === 'クール') return 'reserved';
  if (personality === '好奇心旺盛') return 'playful';
  return 'steady';
}

export function detectInteractionTheme(entry: LogEntryLike): InteractionTheme {
  if (entry.soundKey === 'love' || entry.soundKey === 'cute') return 'affection';
  if (entry.soundKey === 'food') return 'food';
  if (entry.soundKey === 'play') return 'play';
  if (entry.soundKey === 'sleep') return 'rest';
  if (entry.soundKey === 'lonely') return 'comfort';
  if (entry.soundKey === 'no') return 'discipline';
  if (entry.mood === '興味') return 'curiosity';
  if (entry.mood === '安心') return 'comfort';

  const text = `${entry.rawText} ${entry.translatedText}`;
  if (/好き|大好き|愛|かわいい|なで|そば/.test(text)) return 'affection';
  if (/ごはん|ご飯|おやつ|ちゅーる|食べ/.test(text)) return 'food';
  if (/遊|あそ|ボール|ねこじゃらし/.test(text)) return 'play';
  if (/ねむ|眠|寝|おやすみ/.test(text)) return 'rest';
  if (/さびし|寂し|いない|ここ/.test(text)) return 'comfort';
  if (/だめ|ダメ|やめ|こら|怒/.test(text)) return 'discipline';
  if (/なに|何|きになる|気になる/.test(text)) return 'curiosity';
  return 'general';
}

function deriveRelationshipStage(interactionCount: number): RelationshipStage {
  if (interactionCount >= 24) return 'attached';
  if (interactionCount >= 12) return 'bonded';
  if (interactionCount >= 4) return 'warming';
  return 'new';
}

function pickDominantTheme(
  topicCounts: Record<InteractionTheme, number>,
  recentThemes: InteractionTheme[]
): InteractionTheme {
  let bestTheme: InteractionTheme = 'general';
  let bestScore = -1;

  (Object.keys(topicCounts) as InteractionTheme[]).forEach((theme) => {
    const recencyBoost = recentThemes.filter((item) => item === theme).length * 0.35;
    const score = topicCounts[theme] + recencyBoost;
    if (score > bestScore) {
      bestTheme = theme;
      bestScore = score;
    }
  });

  return bestTheme;
}

function buildMemoryHint(
  stage: RelationshipStage,
  dominantTheme: InteractionTheme,
  favoriteTopic: InteractionTheme | ''
): string {
  const topic = favoriteTopic || dominantTheme;

  if (stage === 'new') {
    return topic === 'general'
      ? 'まだ距離を測っているみたい'
      : `${getTopicLabel(topic)}の反応を覚えはじめています`;
  }
  if (stage === 'warming') {
    return topic === 'general'
      ? 'やり取りの空気に慣れてきています'
      : `${getTopicLabel(topic)}の流れが増えてきました`;
  }
  if (stage === 'bonded') {
    return topic === 'general'
      ? 'かなり会話の空気ができてきました'
      : `${getTopicLabel(topic)}の時間を期待しているみたい`;
  }
  return topic === 'general'
    ? 'かなり安心して通信しているみたい'
    : `${getTopicLabel(topic)}の流れをかなり覚えています`;
}

function buildCommunicationHint(
  personalityTone: PersonaStyle,
  stage: RelationshipStage,
  dominantTheme: InteractionTheme
): string {
  if (dominantTheme === 'food') return 'ごはん期待値高め';
  if (dominantTheme === 'play') return '遊びの気配が強め';
  if (dominantTheme === 'comfort' || dominantTheme === 'affection') {
    if (personalityTone === 'clingy') return '甘えモード強め';
    if (personalityTone === 'reserved') return '静かな信頼モード';
    return '距離が近い空気';
  }
  if (dominantTheme === 'discipline') return '少し気分に波あり';
  if (dominantTheme === 'rest') return '落ち着きモード';
  if (personalityTone === 'playful') return '探索モード';
  if (stage === 'new') return '通信リンク初期化中';
  return '通信リンク安定';
}

function buildBondHint(
  stage: RelationshipStage,
  personalityTone: PersonaStyle
): string {
  if (stage === 'attached') {
    return personalityTone === 'reserved' ? 'かなり気を許しています' : 'かなりなついています';
  }
  if (stage === 'bonded') {
    return personalityTone === 'playful' ? '反応のノリが安定しています' : 'だいぶ親しさが出ています';
  }
  if (stage === 'warming') {
    return 'やり取りに慣れてきています';
  }
  return 'まだ様子を見ています';
}

function summarizeRecentThemes(recentThemes: InteractionTheme[]): string {
  if (recentThemes.length === 0) return '最近の傾向はまだありません';

  const uniqueThemes = Array.from(new Set(recentThemes.filter((theme) => theme !== 'general')));
  if (uniqueThemes.length === 0) return '最近はふだんのやり取りが中心です';
  if (uniqueThemes.length === 1) return `最近は${getTopicLabel(uniqueThemes[0])}の流れが多めです`;
  return `最近は${getTopicLabel(uniqueThemes[0])}と${getTopicLabel(uniqueThemes[1])}が中心です`;
}

function pickDominantRecentThemes(recentThemes: InteractionTheme[]): InteractionTheme[] {
  const scores = recentThemes.reduce<Record<InteractionTheme, number>>(
    (acc, theme, index) => {
      acc[theme] += index + 1;
      return acc;
    },
    createEmptyTopicCounts()
  );

  return (Object.keys(scores) as InteractionTheme[])
    .filter((theme) => scores[theme] > 0 && theme !== 'general')
    .sort((a, b) => scores[b] - scores[a])
    .slice(0, 2);
}

export function buildCatPersonaState(
  profile: CatProfileLike,
  log: LogEntryLike[]
): CatPersonaState {
  const topicCounts = createEmptyTopicCounts();
  const themes = log.map(detectInteractionTheme);

  themes.forEach((theme) => {
    topicCounts[theme] += 1;
  });

  const recentThemes = themes.slice(-5);
  const interactionCount = log.length;
  const dominantTheme =
    interactionCount === 0 ? 'general' : pickDominantTheme(topicCounts, recentThemes);
  const favoriteTopic =
    dominantTheme !== 'general' && topicCounts[dominantTheme] >= 2 ? dominantTheme : '';
  const relationshipStage = deriveRelationshipStage(interactionCount);
  const personalityTone = getPersonalityTone(profile.personality);

  const recentCatMoods = log
    .filter((entry) => entry.direction === 'cat_to_human' && entry.mood)
    .slice(-4)
    .map((entry) => entry.mood);
  const recentMoodTrend =
    recentCatMoods.length === 0
      ? ''
      : recentCatMoods.reduce((best, mood) => {
          const bestCount = recentCatMoods.filter((item) => item === best).length;
          const moodCount = recentCatMoods.filter((item) => item === mood).length;
          return moodCount >= bestCount ? mood : best;
        }, recentCatMoods[0]);

  const recentDirections = log.slice(-6).map((entry) => entry.direction);
  const humanCount = recentDirections.filter((direction) => direction === 'human_to_cat').length;
  const catCount = recentDirections.length - humanCount;
  const recentDirectionTrend =
    humanCount >= catCount + 2
      ? 'human_led'
      : catCount >= humanCount + 2
        ? 'cat_led'
        : 'balanced';
  const dominantRecentThemes = pickDominantRecentThemes(recentThemes);
  const latestInteractionAt = log.length > 0 ? log[log.length - 1].createdAt : null;

  return {
    interactionCount,
    relationshipStage,
    bondLabel: RELATIONSHIP_LABEL[relationshipStage],
    bondHint: buildBondHint(relationshipStage, personalityTone),
    personalityTone,
    dominantTheme,
    dominantRecentThemes,
    favoriteTopic,
    recentThemes,
    topicCounts,
    recentMoodTrend,
    recentDirectionTrend,
    affectionCount: topicCounts.affection,
    foodCount: topicCounts.food,
    playCount: topicCounts.play,
    restCount: topicCounts.rest,
    comfortCount: topicCounts.comfort,
    latestInteractionAt,
    recentThemeSummary: summarizeRecentThemes(recentThemes),
    memoryHint: buildMemoryHint(relationshipStage, dominantTheme, favoriteTopic),
    communicationHint: buildCommunicationHint(
      personalityTone,
      relationshipStage,
      dominantTheme
    ),
  };
}
